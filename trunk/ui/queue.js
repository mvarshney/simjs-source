var QueueApp = {
	init: function () {
		this.canvas = Raphael("canvas", 600, 400);
		$( "#new_file" ).button({text: false, icons: {primary: "ui-icon-document"}})
		.click(function () {
			QueueApp.reset();
		});
		$( "#load_file" ).button({text: false, icons: {primary: "ui-icon-folder-open"}});
		$( "#save_file" ).button({text: false,icons: {primary: "ui-icon-disk"}});
		$("#file_ops").buttonset();
		
		$("#new_server").button({icons: {primary: "ui-icon-plus"}}).click(function () {
			QueueApp.newServer();
		});
		$("#new_source").button({icons: {primary: "ui-icon-plus"}}).click(function () {
			QueueApp.newSource();
		});
		$("#new_splitter").button({icons: {primary: "ui-icon-plus"}});
		$("#new_monitor").button({icons: {primary: "ui-icon-plus"}});
		$("#connect").button({icons: {primary: "ui-icon-arrowthick-2-se-nw"}})
		.click(function () {
			QueueApp.toggleConnections();
		});
		$("#new_ops").buttonset();
		
		$("#play_sim").button({text: false, icons: {primary: "ui-icon-play"}});
		$("#stop_sim").button({text: false, icons: {primary: "ui-icon-stop"}});
		$("#config_sim").button({icons: {primary: "ui-icon-clock"}});
		$("#sim_ops").buttonset();
	},
	
	reset: function () {
		this.sim = null;
		this.showConn = false;
		this.server_id = 1;
		this.source_id = 1;
		this.splitter_id = 1;
		this.monitor_id = 1;
		
		this.canvas.clear();
		var rect = this.canvas.rect(0, 0, 600, 400);
		rect.attr('fill', '#FFE87C');
		this.posx = 50;
		this.posy = 50;
		this.objects = [];
	},
	
	updateDrop: function () {
		this.posx += 20;
		this.posy += 20;
		if (this.posy > 360) {
			this.posy = 20;
			this.posx -= 200;
		}
	},
	
	newServer: function () {
		var obj = new ServerView(this.canvas, this.posx, this.posy);
		if (this.showConn) obj.showConnectionPoints(true);
		this.objects.push(obj);
		this.updateDrop();
	},
	
	newSource: function () {
		var obj = new SourceView(this.canvas, this.posx, this.posy);
		if (this.showConn) obj.showConnectionPoints(true);
		this.objects.push(obj);
		this.updateDrop();
	},
	
	newSplitter: function () {
		
	},
	
	newMonitor: function () {
		
	},
	
	toggleConnections: function () {
		this.showConn = !this.showConn;
		var len = this.objects.length;
		for (var i = len - 1; i >= 0; i--) {
			var obj = this.objects[i];
			obj.showConnectionPoints(this.showConn);
		}
	},
	
	save: function () {
		
	},
	
	load: function (text) {
		
	},
	
	stringfy: function () {
		
	},
	
	parse: function (json) {
		
	}
};
/*****************************************************************/
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
function ConnectionMover(dx, dy) {
	this.paper.connection(this.conn);
	this.attr({cx: this.ox + dx, cy: this.oy + dy});
}

function ConnectionStart () {
	this.conn = this.paper.connection(this.view.connectFromObject(), this, "#000");
	this.ox = this.attr("cx");
	this.oy = this.attr("cy");
}

function ConnectionEnd () {
	this.conn.line.remove();
	var objects = QueueApp.objects;
	var to = null;
	var len = objects.length;
	for (var i = len - 1; i >= 0; i--) {
		if (!objects[i].connectToPoint) continue;
		var r = objects[i].connectToPoint(),
			x = this.attr('cx'),
			y = this.attr('cy');
		if ((x - r.x) * (x - r.x) + (y - r.y) * (y - r.y) < 16) {
			to = objects[i];
			break;
		}
	}

	if (!to) {
		var outCoord = this.view.connectFromPoint();
		this.attr({cx: outCoord.x, cy: outCoord.y});				
	} else {
		this.hide();
		var from = this.view;
		var conn = this.paper.connection(from.connectFromObject(), to.connectToObject(), "#000");
		conn.line.attr({'stroke-width': 3});
		from.connections.push({from: from, to: to, conn: conn});
		to.connections.push({from: from, to: to, conn: conn});
		from.connected = true;
	}
}

/*****************************************************************/
function ServerView(canvas, x, y) {
	this.canvas = canvas;
	
	this.image = canvas.image('images/server.png', x, y, 116, 55);
	this.image.attr({cursor: 'move'});
	this.image.animate({scale: "1.2 1.2"}, 200, function () {
		this.animate({scale: "1 1"}, 200);		
	});

	this.image.view = this;

	this.qlentext = canvas.text(x, y, '0');

	var RADIUS = 4;
	this.incoming = this.canvas.circle(x, y, RADIUS);
	this.incoming.view = this;
	this.outgoing = this.canvas.circle(x, y, RADIUS);
	this.outgoing.view = this;

	// Connections information
	this.connections = [];
	this.connected = false;

	// Move the shape set to the defined location
	this.moveto(x, y);

	this.incoming.attr({fill: '#b33'});
	this.outgoing.attr({fill: '#3b3'});
	this.incoming.hide();
	this.outgoing.hide();

	// Set up event listeners	
	this.outgoing.drag(ConnectionMover, ConnectionStart, ConnectionEnd);
		
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
	
	this.image.dblclick(function (event) {
		alert("show menu");
	});
	
	
}
ServerView.prototype.moveto = function (x, y) {
	if (x > 500 || y > 350 || x < 0 || y < 0) {
		return;
	}
	
	this.x = x;
	this.y = y;
	
	this.image.attr({x: x, y: y});

	this.qlentext.attr({x: x + 40, y: y});

	var incoord = this.connectToPoint();
	var outcoord = this.connectFromPoint();
	this.incoming.attr({cx: incoord.x, cy: incoord.y}); 
	this.outgoing.attr({cx: outcoord.x, cy: outcoord.y});

	var len = this.connections.length;
	for (var i = 0; i < len; i++) {
		this.canvas.connection(this.connections[i].conn);
	}

};

ServerView.prototype.serverBusy = function () {
	this.circle.attr({fill: '#b44'});
};

ServerView.prototype.serverIdle = function () {
	this.circle.attr({fill: '#4b4'});
};

ServerView.prototype.showConnectionPoints = function (show) {
	if (show) {
		this.incoming.show();
		if (!this.connected) this.outgoing.show();
	} else {
		this.incoming.hide();
		this.outgoing.hide();
	}
};

ServerView.prototype.connectToObject = function () {
	return this.image;
};

ServerView.prototype.connectFromObject = function () {
	return this.image;
};

ServerView.prototype.connectToPoint = function () {
	return {x: this.x - 5, y: this.y + 55 / 2};
};

ServerView.prototype.connectFromPoint = function () {
	return {x: this.x + 116 + 5, y: this.y + 55 / 2};
};

ServerView.prototype.jsonify = function () {
	return {
		x: this.x,
		y: this.y
	};
};

/*****************************************************************/
function SourceView(canvas, x, y) {
	this.canvas = canvas;
	
	// create shapes
	this.image = canvas.image("images/customers.png", x, y, 34, 34);
	this.image.view = this;
	this.image.animate({scale: "1.2 1.2"}, 200, function () {
		this.animate({scale: "1 1"}, 200);		
	});
	
	this.connected = false;
	this.connections = [];
	
	this.outgoing = this.canvas.circle(x, y, 4);
	this.outgoing.view = this;
	
	// move
	this.moveto(x, y);
	
	// set up attributes
	this.image.attr({cursor: 'move'});
	this.outgoing.attr({fill: '#3b3'});
	this.outgoing.hide();

		
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

	this.outgoing.drag(ConnectionMover, ConnectionStart, ConnectionEnd);
}

SourceView.prototype.moveto = function (x, y) {
	if (x > 560 || y > 360 || x < 0 || y < 0) {
		return;
	}
	
	this.x = x;
	this.y = y;
	
	this.image.attr({x: x, y: y});
	this.outgoing.attr({cx: this.x + 34 + 2, cy: this.y + 17});
	
	var len = this.connections.length;
	for (var i = 0; i < len; i++) {
		this.canvas.connection(this.connections[i].conn);
	}
};


SourceView.prototype.showConnectionPoints = function (show) {
	if (show) {
		if (!this.connected) this.outgoing.show();
	} else {
		this.outgoing.hide();	
	}
};

SourceView.prototype.connectFromObject = function () {
	return this.image;
};

SourceView.prototype.connectToPoint = function () {
	return {x: this.x - 5, y: this.y + 34 / 2};
};

SourceView.prototype.connectFromPoint = function () {
	return {x: this.x + 34 + 5, y: this.y + 34 / 2};
};

/***************************************************/

var ServerModel = {
	start: function () {
		this.facility = new Sim.Facility();
	},

	arrive: function (from) {
		var ro = this.useFacility(this.facility, 10);
		if (this.dest) {
			ro.done(this.dest.arrive, this.dest, this);
		}
	}
};

var SourceModel = {
	start: function () {
		this.setTimer(0).done(this.traffic);
	},
	
	traffic: function () {
		if (!this.dest) return;
		
		this.setTimer(10)
		.done(this.dest.arrive, this.dest, this);
	}
}
