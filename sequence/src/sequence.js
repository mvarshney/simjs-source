var Icons = {
	host: {img: "images/host.png", w: 68, h: 48},
	cloud: {img: "images/cloud_orange.png", w: 89, h: 47},
	server: {img: "images/server.png", w: 64, h: 74}
};

function Parse(str) {

	var conf = {version: 1, objects: {}, panels: []};
	var cPanel = null;
	var panelId = 0;
	

	function define(name, type, scale, x, y, hidden) {
		conf.objects[name] = {type: type, scale: scale, x: x, y: y, hidden: hidden};
	}

	function panel(msg, notes, options) {
		cPanel = {type: 'single', 
					name: 'panel_' + panelId ++,
					events: [], 
					parent: cPanel, 
					msg: msg,
					notes: notes, 
					options: options};

		conf.panels.push(cPanel);
	}

	function say(at, msg, x, y, options) {
		cPanel.events.push({
			type: 'say', at: at, msg: msg, x: x, y: y, options: options});
	}

	function send(at, to, msg, x, y, options) {
		cPanel.events.push({
			type: 'send', at: at, to: to, msg: msg, x: x, y: y, options: options});
	}
	
	function hide(at) {
		cPanel.events.push({type: 'hide', at: at});
	}
	
	function show(at) {
		cPanel.events.push({type: 'show', at: at});
	}
	
	function move(at, x, y) {
		cPanel.events.push({type: 'move', x: x, y: y, at: at});
	}
	

	new Function ('define', 'panel', 'say', 'send', 'hide', 'show', 'move', str)
			(define, panel, say, send, hide, show, move);

	return conf;
}


function model() {
	define('A', 'host', 60, 20, 80);
	define('B', 'host', 40, 80, 50);
	
	panel("One fine morning...", "");
	say(['A', 'B'], 'Hello  World', 30, 30, {angles: [[-90, 90], [225, 180]], type: 'rect'});
	say('B', 'Me too', 70, 30, {type: 'ellipse'});
	
	panel('', '', {width: 50, clear: true, frame: false});
	say(null, 'Something\ngreat\nwill\nhappen\nnext', 50, 50, {type: 'none'});

	panel("second panel..");
	move('B', 80, 80)
	send('A', 'B', 'message', 50, 20, {angles: [90, 90], curvy: 10});
	send('B', 'A', 'message', 90, 40, {angles: [-90, -90], curvy: 10});

	
	/*
	say('A', 'Hello World\nMore text to follow', 30, 30, {angles: [-90, 90]});
	say('B', 'I am here as well\nLine two\nLine three', 70, 50, {angles: [-90, 180], frame: false})
	panel()
	locate('B', 80, 50);
	say(null, 'Panel message\nasdf', 30, 8, {type: 'rect'})
	send('A', 'B', 'message\nmode');
	panel()
	hide('A')
	say('B', 'My world is my own', 50, 10, {frame: false})
	panel("", "", {width: 30, frame: false});
	say(null, 'And\nNow\nOther\nSteps', 50, 50, {type: 'rect', frame: false});
	hide('A');
	hide('B')
	panel();
	*/
}

function endPoint(rect, angle, gap) {
	if (gap === undefined) gap = 0;
	
	var a = rect.x - gap,
	    b = rect.y - gap,
		w = rect.width + 2 * gap,
		h = rect.height + 2 * gap,
		tan = -Math.tan(Raphael.rad(angle));
	
	while (angle < 0) angle += 360;
	while (angle >= 360) angle -= 360;

	if (angle >= 45 && angle < 135) {
		return {x: a + w/2 - h / 2 / tan, y: b};
	}
	if (angle >= 135 && angle < 225) {
		return {x: a, y: b + h/2 - tan * w / 2};
	}
	
	if (angle >= 225 && angle < 315) {
		return {x: a + w/2 + h / 2 / tan, y: b + h};
	}
	
	return {x: a + w, y: b + h/2 + tan * w/2};
}

function controlPoint(point, angle, stretch) {
	while (angle < 0) angle += 360;
	while (angle >= 360) angle -= 360;
	
	var tan = Math.tan(Raphael.rad(angle));
	var x1, x2, y1, y2;
	x1 = point.x + stretch * Math.sqrt(1 / (1 + tan * tan));
	x2 = point.x - stretch * Math.sqrt(1 / (1 + tan * tan));
	y1 = point.y - stretch * Math.sqrt(1 / (1 + 1 / (tan * tan)));
	y2 = point.y + stretch * Math.sqrt(1 / (1 + 1 / (tan * tan)));
	
	if (angle >= 0 && angle < 90) return {x: x1, y: y1};
	if (angle >= 90 && angle < 180) return {x: x2, y: y1};
	if (angle >= 270 && angle < 360) return {x: x1, y: y2};
 	return {x: x2, y: y2};
}

function handle_say(cs, pconf, pw, ph, ev) {
	var tx, txbb, b, bb;
	var type = 'ellipse';
	
	if (ev.options) {
		if (ev.options.type) type = ev.options.type;
	}
	
	tx = cs.text(pconf.x + pw * ev.x / 100,
					pconf.y + ph * ev.y / 100,
					ev.msg);
	txbb = tx.getBBox();
	
	if (type === 'rect') {
		b = cs.rect(txbb.x - 2,
				txbb.y - 2,
				txbb.width + 4,
				txbb.height + 4);
		bb = b.getBBox();
	} else if (type === 'ellipse') {
		b = cs.ellipse(
				txbb.x + txbb.width / 2, 
				txbb.y + txbb.height / 2, 
				txbb.width/2 + 10,
				txbb.height);
		
		bb = b.getBBox();
	} else if (type === 'cloud') {
		b = cs.image('images/cloud_plain_T.png',
						txbb.x - 10,
						txbb.y - 10,
						txbb.width + 20,
						txbb.height + 20)
		bb = b.getBBox();
	} else {
		bb = txbb;
	}


	if (ev.at) {
		var srcangle = -90, dstangle = 90;
		
		
		if (ev.at instanceof Array) {
			for (var z = 0; z < ev.at.length; z++) {
				if (ev.options && ev.options.angles) 
					srcangle = ev.options.angles[z][0];
				if (ev.options && ev.options.angles) 
					dstangle = ev.options.angles[z][1];
				var from = endPoint(bb, srcangle, 5);
				var to = endPoint(pconf.objects[ev.at[z]].getBBox(), dstangle);
				var line = ['M', from.x, ' ', from.y, 'L', to.x, ' ', to.y].join();
				cs.path(line).attr({'stroke-dasharray': '-'});
			}
		} else {
			if (ev.options && ev.options.angles) srcangle = ev.options.angles[0];
			if (ev.options && ev.options.angles) dstangle = ev.options.angles[1];
			var from = endPoint(bb, srcangle, 5);
			var to = endPoint(pconf.objects[ev.at].getBBox(), dstangle);
			var line = ['M', from.x, ' ', from.y, 'L', to.x, ' ', to.y].join();
			cs.path(line).attr({'stroke-dasharray': '-'});							
		}
		
	}
}




function handle_send(cs, pconf, pw, ph, ev) {
	var srcangle = 0,
		dstangle = 180,
		stretch = 30,
		from, to, fromctrl, toctrl, pathstr, len, path, mid,
		tx, txbb, bb, b;
		
	if (ev.options && ev.options.angles)
		parseInt(srcangle = ev.options.angles[0]);
	if (ev.options && ev.options.angles)
		parseInt(dstangle = ev.options.angles[1]);
	if (ev.options && ev.options.curvy) 
		stretch = parseInt(ev.options.curvy);
	
	from = endPoint(pconf.objects[ev.at].getBBox(), srcangle);
	to = endPoint(pconf.objects[ev.to].getBBox(), dstangle);
	
	fromctrl = controlPoint(from, srcangle, stretch);
	toctrl = controlPoint(to, dstangle, stretch);

	pathstr = ['M', from.x, from.y, 
				'C', fromctrl.x, fromctrl.y, 
				toctrl.x, toctrl.y,
				to.x, to.y].join(',');


	path = cs.path(pathstr)
			.attr({'stroke-width': 3, 'stroke': 'blue'})
	
	len = Raphael.getTotalLength(pathstr);
	mid = Raphael.getPointAtLength(pathstr, len / 2);
	cs.path(Raphael.getSubpath(pathstr, len*0.4, len*0.6))
		.attr({'stroke-width': 10, 'stroke': 'green'})
			
//	cs.path(['M', from.x, from.y, 'L', fromctrl.x, fromctrl.y].join(',')).attr({stroke: 'red'});
//	cs.path(['M',to.x, to.y, 'L', toctrl.x, toctrl.y].join(',')).attr({stroke: 'red'});

	srcangle = -90;
	tx = cs.text(pconf.x + pw * ev.x / 100,
					pconf.y + ph * ev.y / 100,
					ev.msg);
	txbb = tx.getBBox();
	b = cs.rect(txbb.x - 2,
			txbb.y - 2,
			txbb.width + 4,
			txbb.height + 4);
	bb = b.getBBox();
	
	if (ev.options && ev.options.tailangle) srcangle = ev.options.tailangle;
	var from = endPoint(bb, srcangle, 5);
	var line = ['M', from.x, ' ', from.y, 'L', mid.x, ' ', mid.y].join();
	cs.path(line);
}


function drawComics(conf) {
	var cs = conf.canvas;
	cs.clear();
	var currx = 0,
		curry = 0,
		npanels = conf.panels.length,
		i, j, name, obj, icon, nevents, ev;
		
	for (i = 0; i < npanels; i++) {
		var pconf = conf.panels[i],
			op = pconf.options,
			pw = conf.panelw,
			ph = conf.panelh,
			framed = true;
		
		if (!op) op = {};
		
		// Read options
		if (op.width) pw = pconf.options.width;
		if (op.frame !== undefined) framed = op.frame;
		
		// Draw Panel boundary
		if (currx + conf.gap + pw > conf.width) {
			currx = 0;
			curry += ph + conf.gap;
		} 
		
		pconf.x = currx + conf.gap;
		pconf.y = curry + conf.gap;
		pconf.view = cs.rect(pconf.x, pconf.y, pw, ph);
		if (!framed) pconf.view.attr({stroke: 'none'});
		currx += conf.gap + pw;
		
		// Draw title
		if (pconf.msg) {
			var tx = cs.text(0, 0, pconf.msg).attr({'font-weight': 'bold'});
			var bb = tx.getBBox();
			tx.attr({x: pconf.x + bb.width / 2 + 4, y: pconf.y + bb.height/2 + 4});
			cs.path(['M', pconf.x, ' ', pconf.y + bb.height + 6, 'H', pconf.x + pw].join(''))
				.attr({'stroke-width': 0.5});
		}
		
		// Draw objects
		pconf.objects = {};
		for (name in conf.objects) {
			obj = conf.objects[name];
			icon = Icons[obj.type];
			if (!icon) throw "Object type " + obj.type + " is not supported";
			pconf.objects[name] = 
						cs.image(icon.img, 
								pconf.x + pw * obj.x / 100 - icon.w * obj.scale / 100 / 2,
								pconf.y + ph * obj.y / 100 - icon.h * obj.scale / 100 / 2,
								icon.w * obj.scale / 100,
								icon.h * obj.scale / 100);

			if (op.clear || obj.hidden) pconf.objects[name].hide();
		}
		
		// Draw events
		nevents = pconf.events.length;
		for (j = 0; j < nevents; j++) {
			ev = pconf.events[j];
			switch (ev.type) {
				case 'move': {
					pconf.objects[ev.at].attr({x: pconf.x + pw * ev.x / 100, 
												y: pconf.y + ph * ev.y / 100});
					break;
				}
				case 'hide': {
					pconf.objects[ev.at].hide();
					break;
				}
				case 'show': {
					pconf.objects[ev.at].show();
					break;
				}
				case 'send': {
					handle_send(cs, pconf, ph, pw, ev);
					break;
				}
				
				case 'say': {
					handle_say(cs, pconf, pw, ph, ev);
					break;
				}
			}
		}
		
		// 
	}
	
}

var CANVAS;

function drawInput() {
	var input = $('#input').val();
	var conf;
	try {
		conf = Parse(input);
	} catch (e) {
		$('#error').html("Syntax error in input");
	}
	conf.width = $('#page').width();
	conf.height = $('#page').height();
	conf.gap = 10;
	conf.panelw = 180;
	conf.panelh = 140;
	conf.canvas = CANVAS;

	drawComics(conf);
}

$(function () {
	CANVAS = Raphael('page', $('#page').width(), $('#page').height());
		
	var a = model.toString().split("\n");
	a[0] = null;
	a[a.length - 1] = null;
	modelstr = a.join("\n");
	var conf = Parse(modelstr);
	
	conf.width = $('#page').width();
	conf.height = $('#page').height();
	conf.gap = 10;
	conf.panelw = 180;
	conf.panelh = 140;
	conf.canvas = CANVAS;
	

	
	drawComics(conf);
	
	$('#input').blur(drawInput);
	$('#execute').click(drawInput);
});


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
