var Element = require('src/element.js');

function Food () {
	Element.apply(this, arguments);
}

Food.prototype = Object.create(Element.prototype);
Food.prototype.constructor = Food;

Food.prototype.feed = function() {
	this.isVisible = false;
};

module.exports = Food;