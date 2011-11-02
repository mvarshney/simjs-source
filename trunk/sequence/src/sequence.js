var Icons = {
	host: {img: "images/host.png", w: 68, h: 48},
	cloud: {img: "images/cloud_orange.png", w: 89, h: 47},
	server: {img: "images/server.png", w: 64, h: 74},
	trash: {img: "images/trash.png", w:24, h:24},
	cookie: {img: "images/cookie.png", w: 48, h: 48}
};

function Parse(str) {

	var conf = {version: 1, objects: {}, panels: []};
	var cPanel = null;
	var panelId = 0;
	

	function define(name, type, scale, x, y, hidden) {
		if (cPanel) {
			cPanel.events.push({type: 'define', name: name,
						object: {type: type, scale: scale, x: x, y: y, hidden: hidden}})
		} else {
			conf.objects[name] = {type: type, scale: scale, x: x, y: y, hidden: hidden};
		}
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
	
	function hide(at, options) {
		cPanel.events.push({type: 'hide', at: at, options: options});
	}
	
	function show(at, options) {
		cPanel.events.push({type: 'show', at: at, options: options});
	}
	
	function move(at, x, y, options) {
		cPanel.events.push({type: 'move', x: x, y: y, at: at, options: options});
	}
	
	if (str instanceof Function) {
		str(define, panel, say, send, hide, show, move);
	} else {
		new Function ('define', 'panel', 'say', 'send', 'hide', 'show', 'move', str)
			(define, panel, say, send, hide, show, move);
	}

	return conf;
}


function model(define, panel, say, send, hide, show, move) {
	define('A', 'host', 60, 20, 80);
	define('B', 'host', 40, 80, 50);
	
	panel("title", "", {type: 'banner'});
	panel("One fine morning...", "");
	say(['A', 'B'], 'Hello  World', 30, 30, {angles: [[-90, 90], [0	, 180]], type: 'cloud'});
	say('B', 'Me too', 70, 30, {type: 'ellipse'});
	
	panel('', '', {width: 70, clear: true, frame: false});
	say(null, 'Something\ngreat\nwill\nhappen\nnext', 50, 50, {type: 'cloud', curvy: 20});

	panel("second panel..");
//	move('B', 80, 80)
	send('A', 'B', 'message', 50, 20, {angles: [90, 180], curvy: 30});
	send('B', 'A', 'message', 90, 20, {angles: [-90, -90], curvy: 40});
	panel("title", "", {type: 'banner'});
	panel();
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
	var type = 'none';
	
	if (ev.options) {
		if (ev.options.type) type = ev.options.type;
	}
	
	tx = cs.text(pconf.x + pw * ev.x / 100,
					pconf.y + ph * ev.y / 100,
					ev.msg)
			.attr({'font-family': '"Comic Sans MS", cursive, sans-serif'});
	txbb = tx.getBBox();
	
	if (type === 'rect') {
		b = cs.rect(txbb.x - 2,
				txbb.y - 2,
				txbb.width + 4,
				txbb.height + 4).attr({fill: 'white', 'stroke-width': 0.5});
		bb = b.getBBox();
		
	} else if (type === 'ellipse') {
		b = cs.ellipse(
				txbb.x + txbb.width / 2, 
				txbb.y + txbb.height / 2, 
				txbb.width/2 + 10,
				txbb.height).attr({fill: 'white','stroke-width': 0.5});
		bb = b.getBBox();
	} else if (type === 'cloud') {
		var a = txbb.x, b = txbb.y, w = txbb.width, h = txbb.height, g = 10;
		if (ev.options && ev.options.curvy) g = ev.options.curvy;
		var path = cs.path(['M', a, b, 
				'C', a, b-g, a+w, b-g, a+w, b,
				'C', a+w+g, b, a+w+g, b+h, a+w, b+h,
				'C', a+w, b+h+g, a, b+h+g, a, b+h,
				'C', a-g, b+h, a-g, b, a, b,
				'Z'].join(',')).attr({fill: 'white'});
		b = path;
		bb = b.getBBox();
	} else {
		bb = txbb;
	}
	tx.toFront();

	if (ev.at) {
		var srcangle = -90, dstangle = 90;
		
		
		if (ev.at instanceof Array) {
			for (var z = 0; z < ev.at.length; z++) {
				if (ev.options && ev.options.angles) 
					srcangle = ev.options.angles[z][0];
				if (ev.options && ev.options.angles) 
					dstangle = ev.options.angles[z][1];
				var from = endPoint(bb, srcangle);
				var to = endPoint(pconf.objects[ev.at[z]].getBBox(), dstangle);
				var line = ['M', from.x, ' ', from.y, 'L', to.x, ' ', to.y].join();
				cs.path(line).attr({'stroke-dasharray': '-'});
			}
		} else {
			if (ev.options && ev.options.angles) srcangle = ev.options.angles[0];
			if (ev.options && ev.options.angles) dstangle = ev.options.angles[1];
			var from = endPoint(bb, srcangle);
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
		srcangle = parseInt(ev.options.angles[0]);
	if (ev.options && ev.options.angles)
		dstangle = parseInt(ev.options.angles[1]);
	if (ev.options && ev.options.curvy) 
		stretch = parseInt(ev.options.curvy);
		
	// if this is a packet drop event
	if (!ev.to) {
		from = pconf.objects[ev.at];
		bb = from.getBBox();
		var a = bb.x + bb.width, b = bb.y + bb.height, g = 5;
		cs.path(['M', a-g, b-g, "L", a+g, b+g,
					'M', a+g, b-g, "L", a-g, b+g].join(","))
			.attr({stroke: 'red', 'stroke-width': 3});
		return;
	}
	
	// Draw the thick arrow
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
	
	cs.arrow(toctrl.x, toctrl.y, to.x, to.y, 10)
		.attr({'stroke-width': 3, 'stroke': 'blue'});
	
	// Draw the green packet
	len = Raphael.getTotalLength(pathstr);
	mid = Raphael.getPointAtLength(pathstr, len / 2);
	cs.path(Raphael.getSubpath(pathstr, len*0.4, len*0.6))
		.attr({'stroke-width': 10, 'stroke': 'green'})
	
	// Draw message
	if (ev.msg) {	
		srcangle = -90;
		if (ev.options && ev.options.angles && ev.options.angles.length >= 3)
			srcangle = parseInt(ev.options.angles[2]);

		tx = cs.text(pconf.x + pconf.width * ev.x / 100,
			pconf.y + pconf.height * ev.y / 100,
			ev.msg)
			.attr({'font-family': '"Comic Sans MS", cursive, sans-serif'});
		txbb = tx.getBBox();
		b = cs.rect(txbb.x - 2,
				txbb.y - 2,
				txbb.width + 4,
				txbb.height + 4)
			.attr({fill: 'white', 'stroke-width': 0.5});
		bb = b.getBBox();
		tx.toFront();

		var from = endPoint(bb, srcangle, 5);
		var line = ['M', from.x, ' ', from.y, 'L', mid.x, ' ', mid.y].join();
		cs.path(line);
	}
}


function drawComics(conf) {
	var cs = conf.canvas;
	cs.clear();
	cs.rect(0, 0, conf.width, conf.height).attr({fill: '#FFF9F0'});
	var currx = 0,
		curry = 0,
		npanels = conf.panels.length,
		i, j, name, obj, icon, nevents, ev;
		
	for (i = 0; i < npanels; i++) {
		var pconf = conf.panels[i],
			op = pconf.options || {},
			pw = op.width || conf.panelw,
			ph = conf.panelh,
			framed = op.frame !== undefined ? op.frame : true,
			type = op.type !== undefined ? op.type : 'simple',
			color = op.color || '#fff', // ''90-#8df-#fff',
			cleared = op.clear;
	
		// Determine Panel boundary
		if (type === 'banner') {
	
			if (currx !== 0) { // we are not at new line already
				currx = 0;
				curry += ph + conf.gap;
			}
			pw = conf.width - 2 * conf.gap;
			ph = 20;
			cleared = true;
		}
	 	if (currx + conf.gap + pw > conf.width) {
			currx = 0;
			curry += ph + conf.gap;
		}
		
		pconf.x = currx + conf.gap;
		pconf.y = curry + conf.gap;

		pconf.view = cs.rect(pconf.x, pconf.y, pw, ph)
			.attr({fill: color});
			
		if (!framed) 
			pconf.view.attr({stroke: 'none', fill: 'none'});
			
		if (type === 'banner') {
			currx = 0;
			curry += ph + conf.gap;
		} else {
			currx += conf.gap + pw;
		}
		
		pconf.width = pw;
		pconf.height = ph;
		
		// Draw title
		if (pconf.msg) {
			var tx = cs.text(0, 0, pconf.msg.toUpperCase())
				.attr({'font-weight': 'bold', 
						x: pconf.x +  4,
						y: pconf.y + 10,
						'text-anchor': 'start',
						'font-family': '"Comic Sans MS", cursive, sans-serif'});
			var bb = tx.getBBox();
			cs.rect(pconf.x, pconf.y, pw, bb.height + 6)
				.attr({fill: 'white', 'stroke-width': 0.5});
			tx.toFront();
		}
		
		// Draw objects
		pconf.objects = {};
		if (!cleared) {
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

			if (obj.hidden) pconf.objects[name].hide();
		}
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
					if (ev.options && ev.options.permanent) {
						conf.objects[ev.at].hidden = true;
					}
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
				case 'define': {
					conf.objects[ev.name] = ev.object;
					break;
				}
				case 'drop': {
					delete conf.objects[ev.at];
					break;
				}
			}
		}
		
		// 
	}
	
}



function drawInput(cm) {
//	var input = $('#input').val();
	var input = cm.getValue();
	var conf;
	try {
		conf = Parse(input);
	} catch (e) {
		$('#error').html("Syntax error in input");
		return;
	}
	$('#error').html('Successfully parsed');
	conf.width = $('#page').width();
	conf.height = $('#page').height();
	conf.gap = 10;
	conf.panelw = 180;
	conf.panelh = 140;
	conf.canvas = CANVAS;

	drawComics(conf);
}

var CANVAS;
$(function () {
	CANVAS = Raphael('page', $('#page').width(), $('#page').height());
	
	if (!false)	 {
		var a = model.toString().split("\n");
		a[0] = null;
		a[a.length - 1] = null;
		modelstr = a.join("\n");
		var conf = Parse(crosssitescripting);

		conf.width = $('#page').width();
		conf.height = $('#page').height();
		conf.gap = 10;
		conf.panelw = 180;
		conf.panelh = 140;
		conf.canvas = CANVAS;

		drawComics(conf);
	}
	
	$('#input').blur(drawInput);
	$('#execute').click(drawInput);
});

Raphael.fn.arrow = function(x1, y1, x2, y2, size) {
  var angle = Raphael.angle(x1, y1, x2, y2);
  var a45   = Raphael.rad(angle-45);
  var a45m  = Raphael.rad(angle+45);
  var x2a = x2 + Math.cos(a45) * size;
  var y2a = y2 + Math.sin(a45) * size;
  var x2b = x2 + Math.cos(a45m) * size;
  var y2b = y2 + Math.sin(a45m) * size;
  return this.path(
    "M"+x2+" "+y2+"L"+x2a+" "+y2a+
    "M"+x2+" "+y2+"L"+x2b+" "+y2b
  );
};

