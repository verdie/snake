function Element(options) {
	options = options || {};
	this.x = parseInt(options.x, 10) || 0;
	this.y = parseInt(options.y, 10) || 0;
	this.isVisible = (typeof options.isVisible !== 'undefined') ? options.isVisible : true;
};

Element.prototype.getState = function() {
	return {
		x: this.x,
		y: this.y,
		isVisible: this.isVisible
	};
};

module.exports = Element;