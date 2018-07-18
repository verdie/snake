"format amd";
(function(global) {

  var defined = {};

  // indexOf polyfill for IE8
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++)
      if (this[i] === item)
        return i;
    return -1;
  }

  var getOwnPropertyDescriptor = true;
  try {
    Object.getOwnPropertyDescriptor({ a: 0 }, 'a');
  }
  catch(e) {
    getOwnPropertyDescriptor = false;
  }

  var defineProperty;
  (function () {
    try {
      if (!!Object.defineProperty({}, 'a', {}))
        defineProperty = Object.defineProperty;
    }
    catch (e) {
      defineProperty = function(obj, prop, opt) {
        try {
          obj[prop] = opt.value || opt.get.call(obj);
        }
        catch(e) {}
      }
    }
  })();

  function register(name, deps, declare) {
    if (arguments.length === 4)
      return registerDynamic.apply(this, arguments);
    doRegister(name, {
      declarative: true,
      deps: deps,
      declare: declare
    });
  }

  function registerDynamic(name, deps, executingRequire, execute) {
    doRegister(name, {
      declarative: false,
      deps: deps,
      executingRequire: executingRequire,
      execute: execute
    });
  }

  function doRegister(name, entry) {
    entry.name = name;

    // we never overwrite an existing define
    if (!(name in defined))
      defined[name] = entry;

    // we have to normalize dependencies
    // (assume dependencies are normalized for now)
    // entry.normalizedDeps = entry.deps.map(normalize);
    entry.normalizedDeps = entry.deps;
  }


  function buildGroups(entry, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1)
      return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];

      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated)
        continue;

      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === undefined || depEntry.groupIndex < depGroupIndex) {

        // if already in a group, remove from the old group
        if (depEntry.groupIndex !== undefined) {
          groups[depEntry.groupIndex].splice(indexOf.call(groups[depEntry.groupIndex], depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0)
            throw new TypeError("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, groups);
    }
  }

  function link(name) {
    var startEntry = defined[name];

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative)
          linkDeclarativeModule(entry);
        else
          linkDynamicModule(entry);
      }
      curGroupDeclarative = !curGroupDeclarative; 
    }
  }

  // module binding records
  var moduleRecords = {};
  function getOrCreateModuleRecord(name) {
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      exports: {}, // start from an empty module and extend
      importers: []
    })
  }

  function linkDeclarativeModule(entry) {
    // only link if already not already started linking (stops at circular)
    if (entry.module)
      return;

    var module = entry.module = getOrCreateModuleRecord(entry.name);
    var exports = entry.module.exports;

    var declaration = entry.declare.call(global, function(name, value) {
      module.locked = true;

      if (typeof name == 'object') {
        for (var p in name)
          exports[p] = name[p];
      }
      else {
        exports[name] = value;
      }

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          for (var j = 0; j < importerModule.dependencies.length; ++j) {
            if (importerModule.dependencies[j] === module) {
              importerModule.setters[j](exports);
            }
          }
        }
      }

      module.locked = false;
      return value;
    });

    module.setters = declaration.setters;
    module.execute = declaration.execute;

    // now link all the module dependencies
    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = defined[depName];
      var depModule = moduleRecords[depName];

      // work out how to set depExports based on scenarios...
      var depExports;

      if (depModule) {
        depExports = depModule.exports;
      }
      else if (depEntry && !depEntry.declarative) {
        depExports = depEntry.esModule;
      }
      // in the module registry
      else if (!depEntry) {
        depExports = load(depName);
      }
      // we have an entry -> link
      else {
        linkDeclarativeModule(depEntry);
        depModule = depEntry.module;
        depExports = depModule.exports;
      }

      // only declarative modules have dynamic bindings
      if (depModule && depModule.importers) {
        depModule.importers.push(module);
        module.dependencies.push(depModule);
      }
      else
        module.dependencies.push(null);

      // run the setter for this dependency
      if (module.setters[i])
        module.setters[i](depExports);
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name) {
    var exports;
    var entry = defined[name];

    if (!entry) {
      exports = load(name);
      if (!exports)
        throw new Error("Unable to load dependency " + name + ".");
    }

    else {
      if (entry.declarative)
        ensureEvaluated(name, []);

      else if (!entry.evaluated)
        linkDynamicModule(entry);

      exports = entry.module.exports;
    }

    if ((!entry || entry.declarative) && exports && exports.__useDefault)
      return exports['default'];

    return exports;
  }

  function linkDynamicModule(entry) {
    if (entry.module)
      return;

    var exports = {};

    var module = entry.module = { exports: exports, id: entry.name };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
        var depName = entry.normalizedDeps[i];
        var depEntry = defined[depName];
        if (depEntry)
          linkDynamicModule(depEntry);
      }
    }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(global, function(name) {
      for (var i = 0, l = entry.deps.length; i < l; i++) {
        if (entry.deps[i] != name)
          continue;
        return getModule(entry.normalizedDeps[i]);
      }
      throw new TypeError('Module ' + name + ' not declared as a dependency.');
    }, exports, module);

    if (output)
      module.exports = output;

    // create the esModule object, which allows ES6 named imports of dynamics
    exports = module.exports;
 
    if (exports && exports.__esModule) {
      entry.esModule = exports;
    }
    else {
      entry.esModule = {};
      
      // don't trigger getters/setters in environments that support them
      if (typeof exports == 'object' || typeof exports == 'function') {
        if (getOwnPropertyDescriptor) {
          var d;
          for (var p in exports)
            if (d = Object.getOwnPropertyDescriptor(exports, p))
              defineProperty(entry.esModule, p, d);
        }
        else {
          var hasOwnProperty = exports && exports.hasOwnProperty;
          for (var p in exports) {
            if (!hasOwnProperty || exports.hasOwnProperty(p))
              entry.esModule[p] = exports[p];
          }
         }
       }
      entry.esModule['default'] = exports;
      defineProperty(entry.esModule, '__useDefault', {
        value: true
      });
    }
  }

  /*
   * Given a module, and the list of modules for this current branch,
   *  ensure that each of the dependencies of this module is evaluated
   *  (unless one is a circular dependency already in the list of seen
   *  modules, in which case we execute it)
   *
   * Then we evaluate the module itself depth-first left to right 
   * execution to match ES6 modules
   */
  function ensureEvaluated(moduleName, seen) {
    var entry = defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (!entry || entry.evaluated || !entry.declarative)
      return;

    // this only applies to declarative modules which late-execute

    seen.push(moduleName);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!defined[depName])
          load(depName);
        else
          ensureEvaluated(depName, seen);
      }
    }

    if (entry.evaluated)
      return;

    entry.evaluated = true;
    entry.module.execute.call(global);
  }

  // magical execution function
  var modules = {};
  function load(name) {
    if (modules[name])
      return modules[name];

    var entry = defined[name];

    // first we check if this module has already been defined in the registry
    if (!entry)
      throw "Module " + name + " not present.";

    // recursively ensure that the module and all its 
    // dependencies are linked (with dependency group handling)
    link(name);

    // now handle dependency execution in correct order
    ensureEvaluated(name, []);

    // remove from the registry
    defined[name] = undefined;

    // exported modules get __esModule defined for interop
    if (entry.declarative)
      defineProperty(entry.module.exports, '__esModule', { value: true });

    // return the defined module object
    return modules[name] = entry.declarative ? entry.module.exports : entry.esModule;
  };

  return function(mains, depNames, declare) {
    return function(formatDetect) {
      formatDetect(function(deps) {
        var System = {
          _nodeRequire: typeof require != 'undefined' && require.resolve && typeof process != 'undefined' && require,
          register: register,
          registerDynamic: registerDynamic,
          get: load, 
          set: function(name, module) {
            modules[name] = module; 
          },
          newModule: function(module) {
            return module;
          }
        };
        System.set('@empty', {});

        // register external dependencies
        for (var i = 0; i < depNames.length; i++) (function(depName, dep) {
          if (dep && dep.__esModule)
            System.register(depName, [], function(_export) {
              return {
                setters: [],
                execute: function() {
                  for (var p in dep)
                    if (p != '__esModule' && !(typeof p == 'object' && p + '' == 'Module'))
                      _export(p, dep[p]);
                }
              };
            });
          else
            System.registerDynamic(depName, [], false, function() {
              return dep;
            });
        })(depNames[i], arguments[i]);

        // register modules in this bundle
        declare(System);

        // load mains
        var firstLoad = load(mains[0]);
        if (mains.length > 1)
          for (var i = 1; i < mains.length; i++)
            load(mains[i]);

        if (firstLoad.__useDefault)
          return firstLoad['default'];
        else
          return firstLoad;
      });
    };
  };

})(typeof self != 'undefined' ? self : global)
/* (['mainModule'], ['external-dep'], function($__System) {
  System.register(...);
})
(function(factory) {
  if (typeof define && define.amd)
    define(['external-dep'], factory);
  // etc UMD / module pattern
})*/

(['0'], [], function($__System) {

$__System.registerDynamic("0", ["1", "2", "3"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Food = require("1");
  var Snake = require("2");
  var directions = require("3");
  var food = new Food({
    x: 22,
    y: 12,
    isVisible: true
  });
  var snake = new Snake({
    length: 3,
    direction: directions.RIGHT_DIRECTION
  });
  window.snake = snake;
  console.log(snake.getState());
  snake.direction = directions.RIGHT_DIRECTION;
  snake.move(2);
  console.log(snake.getState());
  snake.direction = directions.DOWN_DIRECTION;
  snake.move(2);
  console.log(snake.getState());
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("1", ["4"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Element = require("4");
  function Food() {
    Element.apply(this, arguments);
  }
  Food.prototype = Object.create(Element.prototype);
  Food.prototype.constructor = Food;
  Food.prototype.feed = function() {
    this.isVisible = false;
  };
  module.exports = Food;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("3", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var directions = {
    LEFT_DIRECTION: 'LEFT_DIRECTION',
    RIGHT_DIRECTION: 'RIGHT_DIRECTION',
    UP_DIRECTION: 'UP_DIRECTION',
    DOWN_DIRECTION: 'DOWN_DIRECTION'
  };
  module.exports = directions;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("2", ["5", "3"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var SnakePart = require("5");
  var directions = require("3");
  function Snake(options) {
    options = options || {};
    this.parts = [];
    this.head;
    this.length = options.length;
    this.direction = options.direction ? options.direction : directions.RIGHT_DIRECTION;
    for (var i = this.length - 1; i >= 0; i--) {
      var coords = {
        x: 0,
        y: 0
      };
      if (this.direction === directions.LEFT_DIRECTION) {
        coords.x -= i;
      } else if (this.direction === directions.RIGHT_DIRECTION) {
        coords.x += i;
      } else if (this.direction === directions.UP_DIRECTION) {
        coords.y -= i;
      } else if (this.direction === directions.DOWN_DIRECTION) {
        coords.y += i;
      }
      this.parts.push(new SnakePart({
        direction: this.direction,
        x: coords.x,
        y: coords.y,
        isVisible: true
      }));
    }
    ;
    this.length = this.parts.length;
    this.head = this.parts[0];
  }
  Snake.prototype.eat = function() {
    var lastSnakePart,
        foodDirection,
        foodPart;
    this.length = this.parts.length;
    if (this.length) {
      lastSnakePart = this.parts[this.parts.length - 1];
      foodDirection = lastSnakePart.direction;
      foodPart = new SnakePart({
        direction: foodDirection,
        x: lastSnakePart.x,
        y: lastSnakePart.y,
        isVisible: true
      });
    } else {
      foodDirection = this.direction;
      foodPart = new SnakePart({
        direction: foodDirection,
        x: 0,
        y: 0,
        isVisible: true
      });
    }
    foodPart.move(-1);
    this.parts.push(foodPart);
    this.head = this.parts[0];
    this.length = this.parts.length;
  };
  Snake.prototype.move = function(steps) {
    steps = (typeof steps !== 'undefined') ? steps : 1;
    for (var j = steps - 1; j >= 0; j--) {
      for (var i = this.parts.length - 1; i >= 0; i--) {
        var nextPart = this.parts[i - 1];
        this.parts[i].direction = nextPart ? nextPart.direction : this.direction;
        this.parts[i].move(1);
      }
      ;
    }
    ;
  };
  Snake.prototype.getState = function() {
    var self = this;
    var partsState = [];
    for (var i = 0; i < self.parts.length; i++) {
      partsState.push({
        x: self.parts[i].x,
        y: self.parts[i].y,
        direction: self.parts[i].direction
      });
    }
    ;
    return JSON.stringify(partsState);
  };
  module.exports = Snake;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("5", ["4", "3"], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  var Element = require("4");
  var directions = require("3");
  function SnakePart(options) {
    options = options || {};
    Element.apply(this, arguments);
    this.direction = options.direction ? options.direction : directions.RIGHT_DIRECTION;
  }
  SnakePart.prototype = Object.create(Element.prototype);
  SnakePart.prototype.constructor = SnakePart;
  SnakePart.RIGHT_DIRECTION = SnakePart.prototype.RIGHT_DIRECTION = directions.RIGHT_DIRECTION;
  SnakePart.LEFT_DIRECTION = SnakePart.prototype.LEFT_DIRECTION = directions.LEFT_DIRECTION;
  SnakePart.UP_DIRECTION = SnakePart.prototype.UP_DIRECTION = directions.UP_DIRECTION;
  SnakePart.DOWN_DIRECTION = SnakePart.prototype.DOWN_DIRECTION = directions.DOWN_DIRECTION;
  SnakePart.prototype.move = function(steps) {
    steps = steps || 0;
    if (this.direction === directions.LEFT_DIRECTION) {
      this.x -= steps;
    } else if (this.direction === directions.RIGHT_DIRECTION) {
      this.x += steps;
    } else if (this.direction === directions.UP_DIRECTION) {
      this.y -= steps;
    } else if (this.direction === directions.DOWN_DIRECTION) {
      this.y += steps;
    }
  };
  module.exports = SnakePart;
  global.define = __define;
  return module.exports;
});

$__System.registerDynamic("4", [], true, function(require, exports, module) {
  ;
  var global = this,
      __define = global.define;
  global.define = undefined;
  function Element(options) {
    options = options || {};
    this.x = parseInt(options.x, 10) || 0;
    this.y = parseInt(options.y, 10) || 0;
    this.isVisible = (typeof options.isVisible !== 'undefined') ? options.isVisible : true;
  }
  ;
  Element.prototype.getState = function() {
    return {
      x: this.x,
      y: this.y,
      isVisible: this.isVisible
    };
  };
  module.exports = Element;
  global.define = __define;
  return module.exports;
});

})
(function(factory) {
  if (typeof define == 'function' && define.amd)
    define([], factory);
  else
    factory();
});
//# sourceMappingURL=index.js.map