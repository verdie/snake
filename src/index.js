var Food = require('src/food.js');
var Snake = require('src/snake.js');
var directions = require('src/directions.js');
// require('./snake.part.js');
// require('./snake.js');

// console.log(directions.DOWN_DIRECTION);

var food = new Food({x: 22, y: 12, isVisible: true});

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