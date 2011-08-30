Raphael.fn.connection = function (obj1, obj2, line, bg) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }

	 var bb1 = obj1.getBBox(),
	        bb2 = obj2.getBBox(),
			x1 = bb1.x + bb1.width + 1,
			y1 = bb1.y + bb1.height / 2,
			x4 = bb2.x - 1,
			y4 = bb2.y + bb2.height / 2,
			res = [3, 6];

    dx = Math.max(Math.abs(x1 - x4) / 2, 10);
    dy = Math.max(Math.abs(y1 - y4) / 2, 10);
    var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
        y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
        x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
        y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
    var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");
    if (line && line.line) {
        line.bg && line.bg.attr({path: path});
        line.line.attr({path: path});
    } else {
        var color = typeof line == "string" ? line : "#000";
        return {
            bg: bg && bg.split && this.path(path).attr({stroke: bg.split("|")[0], fill: "none", "stroke-width": bg.split("|")[1] || 3}),
            line: this.path(path).attr({stroke: color, fill: "none"}),
            from: obj1,
            to: obj2
        };
    }
};

/*****************************************************************/
function Server(canvas, x, y) {
	this.canvas = canvas;
	this.canvas.objects.push(this);
	
	// Create shapes
	this.circle = canvas.circle(x, y, Server.RADIUS);			
	this.circle.server = this;

	this.queue = [];
	for (var i = 0; i < Server.NQUEUE; i++) {
		var el = canvas.rect(x, y, Server.QUEUE_WIDTH, Server.QUEUE_HEIGHT);		
		this.queue.push(el);
		el.server = this;
	}

	this.qlentext = canvas.text(x, y, '0');

	var RADIUS = 4;
	var inCoord = this.inPoint();
	var outCoord = this.outPoint();
	this.incoming = this.canvas.circle(inCoord.x, inCoord.y, RADIUS);
	this.incoming.server = this;
	this.outgoing = this.canvas.circle(outCoord.x, outCoord.y, RADIUS);
	this.outgoing.server = this;

	// Connections information
	this.connections = [];
	this.connected = false;

	// Move the shape set to the defined location
	this.moveto(x, y);

	// Set up attributes of shapes (color etc)
	this.circle.attr({fill: '#4b4', cursor: 'move'});			
	for (var i = 0; i < Server.NQUEUE; i++) {
		var el = this.queue[i];
		el.attr({stroke: '#333', 'stroke-width': 1});
	}

	this.incoming.attr({fill: '#b33'});
	this.outgoing.attr({fill: '#3b3'});
	this.incoming.hide();
	this.outgoing.hide();

	// Set up event listeners	
	this.circle.drag(
		function (dx, dy) {
			var server = this.server;
			server.moveto(server.ox + dx, server.oy + dy);
		},
		function () {
			var server = this.server;
			server.ox = server.x;
			server.oy = server.y;
		}, 
		function () {

		});

	this.outgoing.drag(
		function (dx, dy) {
			this.paper.connection(this.conn);
			this.attr({cx: this.ox + dx, cy: this.oy + dy});
		},
		function () {
			this.conn = this.paper.connection(this.server.circle, this, "#000");
			this.ox = this.attr("cx");
			this.oy = this.attr("cy");
		},
		function () {
			this.conn.line.remove();
			var objects = this.paper.objects;
			var to = null;
			var len = objects.length;
			for (var i = len - 1; i >= 0; i--) {
				var r = objects[i].inPoint(),
					x = this.attr('cx'),
					y = this.attr('cy');
				if ((x - r.x) * (x - r.x) + (y - r.y) * (y - r.y) < 16) {
					to = objects[i];
					break;
				}
			}

			if (!to) {
				var outCoord = this.server.outPoint();
				this.attr({cx: outCoord.x, cy: outCoord.y});				
			} else {
				this.hide();
				this.server.connectTo(to);
			}
		});
}

Server.RADIUS = 20;
Server.QUEUE_WIDTH = 6;
Server.QUEUE_HEIGHT = 30;
Server.QUEUE_GAP = 2;
Server.NQUEUE = 5;

Server.prototype.moveto = function (x, y) {
	if (x > 500 || y > 350 || x < 0 || y < 0) {
		return;
	}
	
	this.x = x;
	this.y = y;
	
	this.circle.attr({cx: x + Server.NQUEUE * (Server.QUEUE_GAP + Server.QUEUE_WIDTH) + Server.RADIUS,
		 			  cy: y + Server.RADIUS});
	for (var i = 0; i < Server.NQUEUE; i++) {
		var el = this.queue[i];
		el.attr({x: x + i * (Server.QUEUE_GAP + Server.QUEUE_WIDTH),
							y: y + Server.RADIUS - Server.QUEUE_HEIGHT / 2});
	}
	
	this.qlentext.attr({x: x + 3 * (Server.QUEUE_GAP + Server.QUEUE_WIDTH),
											y: y});


	var inCoord = this.inPoint();
	var outCoord = this.outPoint();
	this.incoming.attr({cx: inCoord.x, cy: inCoord.y});
	this.outgoing.attr({cx: outCoord.x, cy: outCoord.y})

	var len = this.connections.length;
	for (var i = 0; i < len; i++) {
		this.canvas.connection(this.connections[i].conn);
	}

};

Server.prototype.serverBusy = function () {
	this.circle.attr({fill: '#b44'});
};

Server.prototype.serverIdle = function () {
	this.circle.attr({fill: '#4b4'});
};

Server.prototype.showConnectionPoints = function () {
	this.incoming.show();
	if (!this.connected) this.outgoing.show();
};

Server.prototype.hideConnectionPoints = function () {
	this.incoming.hide();
	this.outgoing.hide();
};

Server.prototype.inPoint = function () {
	var RADIUS = 4;
	return {x: this.x - RADIUS - 2, y: this.y + Server.RADIUS};
};

Server.prototype.outPoint = function () {
	var RADIUS = 4;
	return {x: this.x + RADIUS + 2 + Server.NQUEUE * (Server.QUEUE_GAP + Server.QUEUE_WIDTH) + 2 * Server.RADIUS,
	 		y: this.y + Server.RADIUS};
};

Server.prototype.connectTo = function (to) {
	var conn = this.canvas.connection(this.connectFromObject(), to.connectToObject(), "#000");
	this.connections.push({from: this, to: to, conn: conn});
	to.connectFrom(this, conn);
	this.connected = true;
};

Server.prototype.connectFrom = function (from, conn) {
	this.connections.push({from: from, to: this, conn: conn});
};

Server.prototype.connectToObject = function () {
	return this.queue[0];
};

Server.prototype.connectFromObject = function () {
	return this.circle;
};

/*****************************************************************/
