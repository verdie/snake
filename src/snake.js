var SnakePart = require('src/snake.part.js');
var directions = require('src/directions.js')

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

		if(this.direction === directions.LEFT_DIRECTION) {
			coords.x -= i;
		} else if(this.direction === directions.RIGHT_DIRECTION) {
			coords.x += i;
		} else if(this.direction === directions.UP_DIRECTION) {
			coords.y -= i;
		} else if(this.direction === directions.DOWN_DIRECTION) {
			coords.y += i;
		}

		this.parts.push(new SnakePart({
			direction: this.direction,
			x: coords.x,
			y: coords.y,
			isVisible: true
		}));
	};

	this.length = this.parts.length;
	this.head = this.parts[0];
}

Snake.prototype.eat = function () {
	var lastSnakePart,
		foodDirection,
		foodPart;
	this.length = this.parts.length;

	if (this.length){
		lastSnakePart = this.parts[this.parts.length - 1];
		foodDirection = lastSnakePart.direction;
		foodPart = new SnakePart({
			direction: foodDirection,
			x: lastSnakePart.x,
			y: lastSnakePart.y,
			isVisible: true
		});
	}
	else {
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
		};
	};
	// for (var i = 0; i < this.parts.length; i++) {
	// 	this.parts[i].move(steps);
	// 	this.parts[i].direction = this.parts[i - 1] ? this.parts[i - 1].direction || this.direction;
	// };
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
	};

	return JSON.stringify(partsState);
};

module.exports = Snake;