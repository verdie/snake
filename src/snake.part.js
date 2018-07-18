var Element = require('src/element.js');
var directions = require('src/directions.js')

function SnakePart(options) {
	options = options || {};
	Element.apply(this, arguments);
	//this.directions = directions;
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

	if(this.direction === directions.LEFT_DIRECTION) {
		this.x -= steps;
	} else if(this.direction === directions.RIGHT_DIRECTION) {
		this.x += steps;
	} else if(this.direction === directions.UP_DIRECTION) {
		this.y -= steps;
	} else if(this.direction === directions.DOWN_DIRECTION) {
		this.y += steps;
	}
};
module.exports = SnakePart;