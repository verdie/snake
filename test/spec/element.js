'use strict';

var Element = require('../../src/element.js');

describe('base element', function () {
	it('has correct interface', function () {
		var element = new Element();
		expect(element.x).toBeDefined();
		expect(element.y).toBeDefined();
		expect(element.isVisible).toBeDefined();
	});

	it('is visible by default', function () {
		var element = new Element();
		expect(element.isVisible).toBe(true);
	});

	it('has {0;0} coordinates by default', function () {
		var element = new Element();
		expect(element.x).toBe(0);
		expect(element.y).toBe(0);
	});
	
	it('can be configured', function () {
		var config = {
			x: 774,
			y: 88,
			isVisible: false
		}
		var element = new Element(config);
		expect(element.x).toEqual(config.x);
		expect(element.y).toEqual(config.y);
		expect(element.isVisible).toEqual(config.isVisible);
	});
});

