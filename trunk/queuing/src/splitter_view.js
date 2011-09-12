var SplitterView = function (canvas, type, name, x, y, hasIn, hasOut) {
	this.canvas = canvas;
	this.type = type;
	this.name = name;

	this.hidden = [canvas.rect(x, y, 10, 10), canvas.rect(x, y, 10, 10)];
	this.image = canvas.image('images/splitter.png', x, y, 41, 48);
	this.width = 41;
	this.height = 48;

	this.x = x;
	this.y = y;

	this.hidden[0].attr({'stroke-width': '0'});
	this.hidden[1].attr({'stroke-width': '0'});
	this.image.attr({cursor: 'move'});	
	this.image.view = this;
	this.image.animate({scale: "1.2 1.2"}, 200, function () {
		this.animate({scale: "1 1"}, 200);		
	});



	this.settings = canvas.image("images/settings.gif", x, y, 12, 12);
	this.settings.view = this;
	
	this.arrows = [null, null];

	for (var i = 0; i < 2; i ++) {
		var arrow = canvas.image("images/orange-arrow.gif", x, y, 12, 12);
		arrow.view = this;
		arrow.id = i;
		arrow.drag(
			function (dx, dy) {
				this.attr({x: this.ox + dx, y: this.oy + dy});
				this.paper.connection(this.conn);
			}, 
			function () {
				var from = this.view.hidden[this.id];
				this.conn = this.paper.connection(from, this, "#000");
				this.ox = this.attr("x");
				this.oy = this.attr("y");
			},
			function () {
				this.conn.line.remove();
				this.conn = null;
			
				var views = QueueApp.views;
				var len = views.length;
				var x = this.attr('x'),
				var y = this.attr('y');
			
				for (var i = len - 1; i >= 0; i--) {
					var obj = views[i];
					if (obj.acceptDrop(x, y)) {
						this.hide();
						this.view.connect(obj, this.id);
						return;
					}
				}

				var view = this.view;
				if (this.id === 0) {
					this.attr({cx: view.x + view.width + 2, cy: view.y + 5});
				} else {
					this.attr({cx: view.x + view.width + 2, cy: view.y + view.height - 15});
				}
			});
		this.arrows[i] = arrow;
	}
	
	// move
	this.moveto(x, y);

	// Set up event listeners	
	this.image.drag(
		function (dx, dy) {
			var view = this.view;
			view.moveto(view.ox + dx, view.oy + dy);
		},
		function () {
			var view = this.view;
			view.ox = view.x;
			view.oy = view.y;
		}, 
		function () {

		});
	

	this.settings.click(
		function () {
			this.view.model.showSettings(this.view.x, this.view.y);
		});
	
	this.hideButtons = (function (view) {
		return function () {
			view.settings.hide();
		}
	}(this));

	this.timeout = null;
	this.image.mouseover(function () {
		var view = this.view;
		view.settings.show();
		if (view.timeout) clearTimeout(view.timeout);
		view.timeout = setTimeout(view.hideButtons, 2000);
	});
}

SplitterView.prototype.moveto = function (x, y) {
	var len, i, dot;
	
	if (x > 600 - this.width || y > 400 - this.height || x < 0 || y < 0) {
		return;
	}
	
	this.x = x;
	this.y = y;
	
	this.image.attr({x: x, y: y});
	
	this.hidden[0].attr({x: this.x + this.width - 20,
					   y: this.y + 5});
	this.hidden[1].attr({x: this.x + this.width - 20,
					   y: this.y + this.height - 15});


	this.arrows[0].attr({x: this.x + this.width + 2, y: this.y + 5});
	this.arrows[1].attr({x: this.x + this.width + 2, y: this.y + this.height - 15});
	this.settings.attr({x: this.x - 4, y: this.y - 12});

	var len = QueueApp.views.length;
	for (var i = len - 1; i >= 0; i--) {
		QueueApp.views[i].moveConnection(this);
	}

	if (this.arrows[0].conn) this.canvas.connection(this.arrows[0].conn);
	if (this.arrows[1].conn) this.canvas.connection(this.arrows[1].conn);
};


SplitterView.prototype.connect = function (to, channel) {
	var conn = this.canvas.connection(this.hidden[channel], to.dropObject(), "#000");
	conn.line.attr({'stroke-width': 3, 'stroke': '#F7D68A'});
	conn.fromView = this;
	conn.toView = to;
	this.arrows[channel].conn = conn;
	this.arrows[channel].hide();
	this.model.dest[channel] = to.model;
};

SplitterView.prototype.unlink = function () {
	if (this.model) this.model.unlink();
	this.disconnect();
	var len = QueueApp.views.length;
	for (var i = len - 1; i >= 0; i--) {
		QueueApp.views[i].disconnect(this);
	}
	
	this.image.remove();
	this.arrows[0].remove();
	this.arrows[1].remove();
	this.settings.remove();
};

SplitterView.prototype.disconnect = function (dest) {
	for (var i = 0; i < 2; i ++) {
		var arrow = this.arrows[i];
		if (arrow && arrow.conn && (!dest || arrow.conn.toView === dest)) {
			arrow.conn.line.remove();
			arrow.conn = null;

			if (i === 0) {
				arrow.attr({cx: this.x + this.width + 2, cy: this.y + 5});
			} else {
				arrow.attr({cx: this.x + this.width + 2, cy: this.y + this.height - 15});
			}
			arrow.show();
		}
	}
};	

SplitterView.prototype.dropObject = function () {
	return this.image;
};

SplitterView.prototype.acceptDrop = function (x, y) {
	return (x > this.x && x < this.x + this.width
			&& y > this.y && y < this.y + this.height);
};

SplitterView.prototype.moveConnection = function (dest) {
	for (var i = 0; i < 2; i ++) {
		var arrow = this.arrows[i];
		if (arrow && arrow.conn && arrow.conn.toView === dest) {
			this.canvas.connection(arrow.conn);
		}
	}
};

SplitterView.prototype.jsonify = function () {
	var json = {
		x: this.x, 
		y: this.y,
		type: this.type,
		name: this.name,
		out: [null, null]};
	
	
	for (var i = 0; i < 2; i ++) {
		var arrow = this.arrows[i];
		if (arrow.conn) json.out[i] = arrow.conn.toView.name;
	}

	if (this.model) {
		json.model = this.model.jsonify();
	}
	
	return json;
};
