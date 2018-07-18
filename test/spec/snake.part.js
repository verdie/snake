'use strict';

var SnakePart = require('../../src/snake.part.js'),
	Element = require('../../src/element.js');

describe('snake part', function () {
	describe('own interface', function () {
		it('is correct', function () {
			var part = new SnakePart();
			expect(part.LEFT_DIRECTION).toBeDefined();
			expect(part.RIGHT_DIRECTION).toBeDefined();
			expect(part.UP_DIRECTION).toBeDefined();
			expect(part.DOWN_DIRECTION).toBeDefined();
			expect(part.direction).toBeDefined();
			expect(part.move).toBeDefined();
		});

		it('has right direction by default', function () {
			var part = new SnakePart();
			expect(part.direction).toEqual(part.RIGHT_DIRECTION);
		});

		it('construcor has links to constants', function () {
			var part = new SnakePart();
			expect(part.LEFT_DIRECTION).toEqual(SnakePart.LEFT_DIRECTION);
			expect(part.RIGHT_DIRECTION).toEqual(SnakePart.RIGHT_DIRECTION);
			expect(part.UP_DIRECTION).toEqual(SnakePart.UP_DIRECTION);
			expect(part.DOWN_DIRECTION).toEqual(SnakePart.DOWN_DIRECTION);
		});

		it('can be configured', function () {
			var config = {
				direction: SnakePart.DOWN_DIRECTION
			};
			var part = new SnakePart(config);
			expect(part.direction).toEqual(config.direction);
		});
	});
	
	describe('has correct inherited interface', function () {
		it('from base element', function () {
			var part = new SnakePart();
			expect(part.x).toBeDefined();
			expect(part.y).toBeDefined();
			expect(part.isVisible).toBeDefined();
			
		});

		it('and is instance of base element', function () {
			var part = new SnakePart();
			expect(part instanceof Element).toBe(true);
		});

		it('that is visible by default', function () {
			var part = new SnakePart();
			expect(part.isVisible).toBe(true);
		});

		it('that has {0;0} coordinates by default', function () {
			var part = new SnakePart();
			expect(part.x).toBe(0);
			expect(part.y).toBe(0);
		});

		it('that can be configured', function () {
			var config = {
				x: 774,
				y: 88,
				isVisible: false
			}
			var part = new SnakePart(config);
			expect(part.x).toEqual(config.x);
			expect(part.y).toEqual(config.y);
			expect(part.isVisible).toEqual(config.isVisible);
		});
	});

	describe('can move', function () {
		var part;
		beforeEach(function () {
			part = new SnakePart({ x: 10, y: 10 });
			spyOn(part, 'move').and.callThrough();
		});
		it('left', function () {
			var steps = 3;
			part.direction = part.LEFT_DIRECTION;
			part.move(steps);
			expect(part.x).toEqual(7);
			expect(part.y).toEqual(10);
		});
		it('right', function () {
			var steps = 4;
			part.direction = part.RIGHT_DIRECTION;
			part.move(steps);
			expect(part.x).toEqual(14);
			expect(part.y).toEqual(10);
		});
		it('up', function () {
			var steps = 15;
			part.direction = part.UP_DIRECTION;
			part.move(steps);
			expect(part.x).toEqual(10);
			expect(part.y).toEqual(-5);
		});
		it('down', function () {
			var steps = 3;
			part.direction = part.DOWN_DIRECTION;
			part.move(steps);
			expect(part.x).toEqual(10);
			expect(part.y).toEqual(13);
		});
	});

	describe('don\'t move, if no steps', function () {
		var part;
		beforeEach(function () {
			part = new SnakePart({ x: 10, y: 10 });
		});
		[
			SnakePart.LEFT_DIRECTION,
			SnakePart.RIGHT_DIRECTION,
			SnakePart.UP_DIRECTION,
			SnakePart.DOWN_DIRECTION
		].forEach(function (direction) {
			it(direction, function () {
				part.direction = direction;
				part.move();
				expect(part.x).toEqual(10);
				expect(part.y).toEqual(10);
			});
		});
	});
});