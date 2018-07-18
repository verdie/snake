'use strict';

var Food = require('../../src/food.js'),
	Element = require('../../src/element.js');

describe('food', function () {
	it('has correct own interface', function () {
		var food = new Food();
		expect(food.feed).toBeDefined();
	});

	describe('has correct inherited interface', function () {
		it('from base element', function () {
			var food = new Food();
			expect(food.x).toBeDefined();
			expect(food.y).toBeDefined();
			expect(food.isVisible).toBeDefined();
		});

		it('and is instance of base element', function () {
			var food = new Food();
			expect(food instanceof Element).toBe(true);
		});

		it('and visible by default', function () {
			var food = new Food();
			expect(food.isVisible).toBe(true);
		});

		it('and has {0;0} coordinates by default', function () {
			var food = new Food();
			expect(food.x).toBe(0);
			expect(food.y).toBe(0);
		});

		it('that can be configured', function () {
			var config = {
				x: 774,
				y: 88,
				isVisible: false
			}
			var food = new Food(config);
			expect(food.x).toEqual(config.x);
			expect(food.y).toEqual(config.y);
			expect(food.isVisible).toEqual(config.isVisible);
		});
	});

	it('disappears, when eaten (isVisible === false)', function () {
		var food = new Food();
		food.feed();
		expect(food.isVisible).toBe(false);
	});
	
});
