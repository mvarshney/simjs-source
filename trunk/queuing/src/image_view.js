var ImageView = function (canvas, type, name, x, y, hasIn, hasOut) {
	this.canvas = canvas;
	this.type = type;
	this.name = name;

	
	if (type === 'queue') {
		this.width = 116 * 0.8;
		this.height = 55 * 0.8;
		this.image = canvas.image('images/server.png', x, y, this.width, this.height);

	} else if (type === 'source') {
		this.image = canvas.image('images/customers.png', x, y, 34, 34);
		this.width = 34;
		this.height = 34;
	} else if (type === 'sink') {
		this.width = 32;
		this.height = 32;
		this.image = canvas.image('images/door_out.png', x, y, this.width, this.height);
	}
	this.x = x;
	this.y = y;
	this.hasIn = hasIn;
	this.hasOut = hasOut;
	
	this.text = canvas.text(x, y, this.name);
	this.counters = canvas.text(x, y, '');
	this.counters.hide();

	this.image.attr({cursor: 'move'});
	this.image.view = this;
	this.image.animate({scale: "1.2 1.2"}, 200, function () {
		this.animate({scale: "1 1"}, 200);		
	});
	
	if (this.hasOut) {
		this.arrow = canvas.image("images/orange-arrow.gif", x, y, 12, 12);
		this.arrow.view = this;
		this.arrow.drag(
			function (dx, dy) {
				this.attr({x: this.ox + dx, y: this.oy + dy});
				this.paper.connection(this.conn);
			}, 
			function () {
				this.conn = this.paper.connection(this.view.image, this, "#000");
				this.ox = this.attr("x");
				this.oy = this.attr("y");
			},
			function () {
				this.conn.line.remove();
				this.conn = null;
			
				var views = QueueApp.views;
				var len = views.length;
				var x = this.attr('x');
				var y = this.attr('y');
			
				for (var i = len - 1; i >= 0; i--) {
					var obj = views[i];
					if (obj.acceptDrop(x, y)) {
						this.hide();
						this.view.connect(obj);
						return;
					}
				}

				var view = this.view;
				this.attr({x: view.x + view.width + 2, y: view.y + view.height / 2 - 6});
			});
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
	
	this.image.dblclick(function () {
		this.view.model.showSettings();
	});
}

ImageView.prototype.moveto = function (x, y) {
	var len, i, dot;
	
	if (x > 600 - this.width || y > 400 - this.height || x < 0 || y < 0) {
		return;
	}
	
	this.x = x;
	this.y = y;
	
	this.image.attr({x: x, y: y});
	this.text.attr({x: this.x + this.width / 2, y: this.y + this.height + 5});
	this.counters.attr({x: this.x + this.width / 2, y: this.y + this.height + 20});
	if (this.arrow) {
		this.arrow.attr({x: this.x + this.width + 2, y: this.y + this.height / 2 - 6});
	}
	
	if (this.hasIn) {
		var len = QueueApp.views.length;
		for (var i = len - 1; i >= 0; i--) {
			QueueApp.views[i].moveConnection(this);
		}
	}
	
	if (this.arrow && this.arrow.conn) {
		this.canvas.connection(this.arrow.conn);
	}
};


ImageView.prototype.connect = function (to) {
	var conn = this.canvas.connection(this.image, to.dropObject(), "#000");
	conn.line.attr({'stroke-width': 3, 'stroke': '#F7D68A'});
	conn.fromView = this;
	conn.toView = to;
	this.arrow.conn = conn;
	this.arrow.hide();
	this.model.dest = to.model;
};

ImageView.prototype.unlink = function () {
	var i, len, index;
	
	len = QueueApp.models.length;
	for (i = len - 1; i >= 0; i--) {
		if (QueueApp.models[i] === this.model) {
			index = i;
			break;
		}
	}
	
	if (index) QueueApp.models.splice(index, 1);
	
	
	if (this.model) this.model.unlink();
	this.disconnect();
	len = QueueApp.views.length;
	for (i = len - 1; i >= 0; i--) {
		QueueApp.views[i].disconnect(this);
		if (QueueApp.views[i] === this) index = i;
	}
	
	QueueApp.views.splice(index, 1);
	
	this.image.remove();
	if (this.arrow) this.arrow.remove();
	this.counters.remove();
	this.text.remove();

};

ImageView.prototype.disconnect = function (dest) {
	if (this.arrow && this.arrow.conn && (!dest || this.arrow.conn.toView === dest)) {
		this.arrow.conn.line.remove();
		this.arrow.conn = null;
		this.arrow.attr({x: this.x + this.width + 2, y: this.y + this.height / 2 - 6});
		this.arrow.show();
		this.model.dest = null;
	}
};	

ImageView.prototype.dropObject = function () {
	return this.image;
};

ImageView.prototype.acceptDrop = function (x, y) {
	if (!this.hasIn) return false;
	return (x > (this.x - 10) && x < (this.x + this.width + 10)
			&& y > (this.y - 10) && y < (this.y + this.height + 10));
};

ImageView.prototype.moveConnection = function (dest) {
	if (this.arrow && this.arrow.conn && this.arrow.conn.toView === dest) {
		this.canvas.connection(this.arrow.conn);
	}
};

ImageView.prototype.jsonify = function () {
	var json = {
		x: this.x, 
		y: this.y,
		type: this.type,
		name: this.name};
	
	if (this.arrow && this.arrow.conn) {
		json.out = this.arrow.conn.toView.name;
	}
	
	if (this.model) {
		json.model = this.model.jsonify();
	}
	
	return json;
};

ImageView.prototype.showCounters = function (incoming, outgoing) {
/*
	var msg = '';

	if (!isNaN(incoming)) msg += 'In: ' + incoming;
	if (!isNaN(outgoing)) msg += '  Out: ' + outgoing;
	this.counters.attr({text: msg});
	this.counters.show();
	*/
};
