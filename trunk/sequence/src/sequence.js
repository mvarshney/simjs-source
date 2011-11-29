Array.prototype.trim = function () {
	return $.map(this, $.trim);
}

function readOptions(lines, num) {
	var options = {}, len = lines.length, pairs, npairs, i, keyval;
	num ++;
	while (num < len && lines[num][0] === '-') {
		pairs = lines[num].substr(lines[num].indexOf('-') + 1).split(',').trim();
		for (i = pairs.length - 1; i>=0; i--) {
			keyval = pairs[i].split('=').trim();
			if (keyval[0].length === 0) continue;
			options[keyval[0]] = keyval[1];
		}
		
		num++;
	}
	
	return options;
}

function ParseText(str) {
	var conf = {version: 1, objects: {}, panels: []},
		cPanel = null,
		panelId = 0,
		lines = str.split('\n').trim(),
		nlines = lines.length,
		line, words, lineno, i, j,
		records = {},
		recording = false;
	
	
	for (lineno = 0; lineno < nlines; lineno++) {
		line = lines[lineno];
		if (line.length === 0) continue;
		if (line[0] === '#') continue;
		words = line.split(/\s+/).trim();


		if (words[0] === 'record') {
			recording = words[1];
			records[recording] = [];
			continue;
		}
		
		if (words[0] === 'done') {
			recording = false;
			continue;
		}
		
		if (recording) {
			records[recording].push(line);
			continue;
		}
		
		if (words[0] === 'replay') {
			lines = lines.slice(0, lineno).concat(records[words[1]], lines.splice(lineno + 1));
			nlines += records[words[1]].length - 1;
			lineno --;
			continue;
		}

		if (words[0][0] === '-') continue;
		// Define command. 
		if (words[0] === 'define') {
			var obj = {type: [words[2], words[3], words[4]], 
						x: words[5], 
						y: words[6], 
						hidden: (words[7] === 'hidden')};
			
			if (cPanel) {
				cPanel.events.push({type: 'define', name: words[1], obj: obj});

			} else {
				conf.objects[words[1]] = obj;
			}
			continue;
		}
		
		if (words[0] === 'end') break;
		
		// panel command
		if (words[0] === 'panel') {
			cPanel = {name: 'panel_' + panelId ++,
						events: [], 
						parent: cPanel ? cPanel.name : "", 
						msg: line.split('panel ')[1],
						options: readOptions(lines, lineno)};
			conf.panels.push(cPanel);
			continue;
		}
		
		if (words[0] === 'move' || words[0] === 'rmove') {
			var objs = line.split(words[0])[1].split(',').trim();
			for (i = objs.length - 1; i >= 0; i--) {
				j = objs[i].split(/\s+/);
				cPanel.events.push({type: words[0],
									at: j[0],
									x: j[1],
									y: j[2],
									options: {permanent: j[3] === 'permanent'}});
			}
				
			continue;
		}
		
		if (words[0] === 'show' || words[0] === 'hide') { 
			var objs = line.split(words[0])[1].split(',').trim();
			for (i = objs.length - 1; i >= 0; i--) {
				j = objs[i].split(/\s+/);
				cPanel.events.push({type: words[0], at: j[0],
						options: {permanent: j[1] === 'permanent'}});
			}
			
			continue;
		}

		if (words[0] === 'mood' || words[0] === 'color') {
			var objs = line.split(words[0])[1].split(',').trim();
			for (i = objs.length - 1; i >= 0; i--) {
				j = objs[i].split(/\s+/);
				cPanel.events.push({type: words[0], at: j[0], val: j[1],
						options: {permanent: j[2] === 'permanent'}});
			}
			
			continue;
		}

				
		//----- The basic elements
		if (line.indexOf(':') === -1) {
			console.log(line);
			continue;
		}
		
		j = line.split(':');
		var send = (j[0].indexOf(' to ') !== -1);
		var from, to, ev = {x: 50, y: 50};
		
		if (send) {
			ev.type = 'send';
			from = j[0].split(' to ')[0];
			to = j[0].split(' to ')[1];
			to = to.split(',').trim();
			if (to.length === 1) {
				ev.to = to[0];
			} else {
				ev.to = to;
			}
		} else {
			ev.type = 'say';
			from = j[0];
		}

		from = from.split(',').trim();
		if (from.length === 1) {
			ev.at = from[0];
		} else {
			ev.at = from;
		}
		
		ev.msg = $.trim(j.slice(1).join(':'));
		ev.msg = ev.msg.replace(/\\n/g, '\n');
		ev.options = readOptions(lines, lineno);
		
		// HACK -- special cases
		if (ev.options.angles) 
			ev.options.angles = ev.options.angles.split(/\s+/).trim();
		
		j = $.trim(lines[lineno + 1]);
		if (j && j[0] === '-') {
			j = j.split(/\s+/);
			ev.x = parseInt(j[1]); 
			ev.y = parseInt(j[2]);
		}
		
		cPanel.events.push(ev);
	}
	
//	console.log(JSON.stringify(conf, null, 4));
	return conf;
}

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
		return {x: a + w/2 - h/2/tan, y: b};
	}
	if (angle >= 135 && angle < 225) {
		return {x: a, y: b + h/2 - tan * w / 2};
	}
	
	if (angle >= 225 && angle < 315) {
		return {x: a + w/2 + h/2/tan, y: b + h};
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

function getAngle(x1, y1, x2, y2) {
	var a = 360 - Raphael.angle(x2, y2, x1, y1);
	while (a < 0) a += 360;
	while (a >= 360) a -= 360;
	return a;
}

function getZone(x1, y1, x2, y2) {
	var a = getAngle(x1, y1, x2, y2);
	if (a <= 45) return 0;
	if (a <=135) return 90;
	if (a <= 225) return 180;
	if (a <= 315) return 270;
	return 0;
}

function handle_say(cs, pconf, pw, ph, ev, index) {
	var tx, txbb, b, bb, path, g1, g2, from, to, angle, i,
		op = ev.options || {},
		color = op.color || '#fff',
		style = op.style || '_',
		tailwidth = op.twidth === undefined ? 5 : parseInt(op.twidth),
		tailangle = (op.tangle === undefined) ? 0 : parseInt(op.tangle),
		tailcurvy = op.tcurvy === undefined ? 20 : parseInt(op.tcurvy),
		xshift = op.xshift === undefined ? 50 : parseInt(op.xshift),
		merge = !!op.merge,
		type = op.type || ((ev.at || merge) ? 'balloon' : 'cloud');
	
	// Step 1: draw text
	if (op.caps === 'true') ev.msg = ev.msg.toUpperCase();
	tx = cs.text(pconf.x + pw * ev.x / 100,
					pconf.y + ph * ev.y / 100,
					ev.msg)
			.attr({'font-family': '"Comic Sans MS", cursive, sans-serif'});
	txbb = tx.getBBox();
	
	// Step 2: draw tail
	if (ev.at) {
		tailwidth = op.twidth === undefined ? Math.max(5, txbb.width/10) : parseInt(op.twidth)
		tailwidth = 5;
		if (ev.at instanceof Array) {
			path = [];
			for (i = ev.at.length - 1; i >= 0; i--) {
				from = {x: txbb.x + txbb.width/2, y: txbb.y + txbb.height/2};
				bb = pconf.objects[ev.at[i]].getBBox();
				angle = getZone(bb.x + bb.width/2, bb.y + bb.height/2, from.x, from.y);
				if (op.angle !== undefined) angle = parseInt(op.angle);

				var to = endPoint(bb, angle);
				
				angle = Raphael.rad(90 + getAngle(from.x, from.y, 
											bb.x + bb.width/2, bb.y + bb.height/2));
				
				path.push(cs.path(['M', from.x - tailwidth*Math.cos(angle), 
									 from.y + tailwidth*Math.sin(angle), 
									'L', to.x, to.y, 
									from.x+tailwidth*Math.cos(angle), 
									from.y-tailwidth*Math.sin(angle), 
									'Z'].join(','))
					.attr({'stroke-width': 1, 'stroke-dasharray': style, fill: color}));
				
			}
		} else {
			from = {x: txbb.x + txbb.width * xshift / 100, 
					y: txbb.y + txbb.height/2};
			bb = pconf.objects[ev.at].getBBox();
			angle = getZone(bb.x + bb.width/2, bb.y + bb.height/2, from.x, from.y);
			if (op.angle !== undefined) angle = parseInt(op.angle);
			
			var to = endPoint(bb, angle);
			
			angle = Raphael.rad(90 + getAngle(from.x, from.y, 
										bb.x + bb.width/2, bb.y + bb.height/2));
			
			
			path = cs.path(['M', from.x - tailwidth*Math.cos(angle), 
								 from.y + tailwidth*Math.sin(angle), 
								'L', to.x, to.y, 
								from.x+tailwidth*Math.cos(angle), 
								from.y-tailwidth*Math.sin(angle), 
								'Z'].join(','));

			path.attr({'stroke-width': 1, 'stroke-dasharray': style, fill: color});
		}	
	}
	
	// Step 3: Draw balloon
	if (type === 'rect') {
		b = cs.rect(txbb.x - 2,
				txbb.y - 2,
				txbb.width + 4,
				txbb.height + 4)
		.attr({fill: color, 'stroke-width': 0.5, 'stroke-dasharray': style});
		bb = b.getBBox();
		
	} else if (type === 'ellipse') {
		b = cs.ellipse(
				txbb.x + txbb.width / 2, 
				txbb.y + txbb.height / 2, 
				txbb.width/2 + 10,
				txbb.height)
		.attr({fill: color,'stroke-width': 0.5, 'stroke-dasharray': style});
		bb = b.getBBox();
	} else if (type === 'cloud') {
		var a = txbb.x, 
			b = txbb.y, 
			w = txbb.width + 2, 
			h = txbb.height + 2, 
			g = Math.max(15, w/6);
		if (ev.options && ev.options.curvy) g = parseInt(ev.options.curvy);
		var dd = ['M', a, b, 
				'C', a, b-g, a+w, b-g, a+w, b,
				'C', a+w+g, b, a+w+g, b+h, a+w, b+h,
				'C', a+w, b+h+g, a, b+h+g, a, b+h,
				'C', a-g, b+h, a-g, b, a, b,
				'Z'].join(',');
		b = cs.path(dd).attr({'stroke-dasharray': style, 'stroke-width': 1.5});
		b = cs.path(dd).attr({fill: color, stroke: 'none'});
//		.attr({fill: color, 'stroke-dasharray': style});
		bb = b.getBBox();
	} else if (type === 'balloon') {
		var a = txbb.x, b = txbb.y, w = txbb.width + 2, h = txbb.height + 2, g = 10;
		g1 = Math.min(w/6, 15);
		g2 = h/4;
		var dd = ['M', a, b,
				'C', a+g1, b-g1, a+w-g1, b-g1, a+w, b,
				'C', a+w+g2, b+g2, a+w+g2, b+h-g2, a+w, b+h,
				'C', a+w-g1, b+h+g1, a+g1, b+h+g1, a, b+h,
				'C', a-g2, b+h-g2, a-g2, b+g2, a, b,
				'Z'].join(',');
				
		b = cs.path(dd).attr({'stroke-dasharray': style, 'stroke-width': 1.5});
		b = cs.path(dd).attr({fill: color, stroke: 'none'});		
		
		bb = b.getBBox();
	} else {
		bb = txbb;
	}
	
	ev.tx = tx;
	ev.b = b;
	
	// Step 4: bring text to front
	if (merge && index > 0) {
		var prev = pconf.events[index - 1];
		if (prev.b) prev.b.toFront();
		if (prev.tx) prev.tx.toFront();
	}
	if (path) {
		if (path instanceof Array) $.each(path, function (i, p){p.toFront();});
		else path.toFront();
	}
	if (b) b.toFront();
	tx.toFront();
	

	// Step 5: If design mode
	if (pconf.conf.design) {
		tx.pconf = pconf;
		tx.drag(
			function (dx, dy) {
				this.attr({x: this.ox + dx, y: this.oy + dy});
			},
			function () {
				this.ox = this.attr('x');
				this.oy = this.attr('y');
			},
			function () {
				pconf.conf.design.val([ ((this.attr('x') - pconf.x) * 100 / pconf.width).toFixed(0),
				((this.attr('y') - pconf.y) * 100 / pconf.height).toFixed(0)].join(' '))
					.focus().select();
				this.attr('title',
					[ ((this.attr('x') - pconf.x) * 100 / pconf.width).toFixed(0),
					((this.attr('y') - pconf.y) * 100 / pconf.height).toFixed(0)].join(', '));
			});
	}
}

function handle_send(cs, pconf, pw, ph, ev) {
	var srcangle, dstangle,
		stretch = 30,
		from, to, fromctrl, toctrl, pathstr, len, path, mid,
		tx, txbb, bb, b, frombb, tobb,
		op = ev.options || {},
		arrow_width = op.awidth || 2,
		arrow_style = op.astyle || '_',
		arrow_color = op.acolor || 'blue',
		arrow_head = op.ahead !== 'false',
		message_color = op.color || 'white',
		packet_color = op.pcolor || 'green',
		packet_location = op.plocate === undefined ? 50 : parseInt(op.plocate),
		packet_width = op.pwidth === undefined ? 10 : parseInt(op.pwidth);
		
	
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
	frombb = pconf.objects[ev.at].getBBox();
	tobb = pconf.objects[ev.to].getBBox();
	srcangle = getZone(frombb.x + frombb.width/2, 
					frombb.y + frombb.height/2,
					tobb.x + tobb.width / 2,
					tobb.y + tobb.height/2);
	dstangle = 	getZone(tobb.x + tobb.width/2, 
					tobb.y + tobb.height/2,
					frombb.x + frombb.width / 2,
					frombb.y + frombb.height/2);

	if (op.angles) srcangle = parseInt(op.angles[0]);
	if (op.angles) dstangle = parseInt(op.angles[1]);
	if (op.curvy) stretch = parseInt(op.curvy);
	
	from = endPoint(frombb, srcangle);
	to = endPoint(tobb, dstangle);
	
	fromctrl = controlPoint(from, srcangle, stretch);
	toctrl = controlPoint(to, dstangle, stretch);

	pathstr = ['M', from.x, from.y, 
				'C', fromctrl.x, fromctrl.y, 
				toctrl.x, toctrl.y,
				to.x, to.y].join(',');

	path = cs.path(pathstr)
			.attr({'stroke-width': arrow_width, 
					'stroke': arrow_color,
					'stroke-dasharray': arrow_style});
	
	if (arrow_head) {
		cs.arrow(toctrl.x, toctrl.y, to.x, to.y, 10)
		.attr({'stroke-width': arrow_width, 
			'stroke': arrow_color, 
			'stroke-dasharray': arrow_style});
	}
	
	// Draw the packet
	if (op.packet !== 'false') {
		len = Raphael.getTotalLength(pathstr);
		mid = Raphael.getPointAtLength(pathstr, len * packet_location/100);
		cs.path(Raphael.getSubpath(pathstr, 
				(packet_location - packet_width/2) /100 * len, 
				(packet_location + packet_width/2)/100 * len))
			.attr({'stroke-width': 10, 'stroke': packet_color})
	}
	
	// Draw message
	if (ev.msg) {	
		// write text
		tx = cs.text(pconf.x + pconf.width * ev.x / 100,
			pconf.y + pconf.height * ev.y / 100,
			ev.msg)
			.attr({'font-family': '"Comic Sans MS", cursive, sans-serif'});
		txbb = tx.getBBox();
		b = cs.rect(txbb.x - 2,
				txbb.y - 2,
				txbb.width + 4,
				txbb.height + 4)
			.attr({fill: message_color, 'stroke-width': 0.5});
		bb = b.getBBox();
		tx.toFront();

		// Draw line
		srcangle = getZone(txbb.x + txbb.width/2, txbb.y + txbb.height/2,
							mid.x, mid.y);
		if (ev.options && ev.options.angles && ev.options.angles.length >= 3)
			srcangle = parseInt(ev.options.angles[2]);

		var from = endPoint(bb, srcangle);
		var line = ['M', from.x, ' ', from.y, 'L', mid.x, ' ', mid.y].join();
		cs.path(line);
		
		// draggable in design mode
		if (pconf.conf.design) {
			tx.pconf = pconf;
			tx.drag(
				function (dx, dy) {
					this.attr({x: this.ox + dx, y: this.oy + dy});
				},
				function () {
					this.ox = this.attr('x');
					this.oy = this.attr('y');
				},
				function () {
					pconf.conf.design.val([ ((this.attr('x') - pconf.x) * 100 / pconf.width).toFixed(0),
					((this.attr('y') - pconf.y) * 100 / pconf.height).toFixed(0)].join(' '))
						.focus().select();
				this.attr('title',
						[ ((this.attr('x') - pconf.x) * 100 / pconf.width).toFixed(0),
						((this.attr('y') - pconf.y) * 100 / pconf.height).toFixed(0)].join(', '));
				});
		}
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
			pw = op.width === undefined ? conf.panelw : conf.panelw + parseInt(op.width),
			ph = conf.panelh,
			framed = op.frame !== undefined ? op.frame : true,
			type = op.type !== undefined ? op.type : 'simple',
			color = op.color || '#eff', //'#fff', // ''90-#8df-#fff',
			cleared = op.clear;
		
		color = '90-' + color + '-#fff';
		pconf.conf = conf;

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

		// Draw grid
		if (op.grid === 'true') {
			for (j = 10; j < 100; j+=20) {
				cs.path(['M', pconf.x + pw*j/100, pconf.y, 
						'V', pconf.y + ph].join(','))
				.attr({'stroke-width': 0.5, 
							'stroke': 'green'});
							
				cs.path(['M', pconf.x + pw*(j+10)/100, pconf.y, 
						'V', pconf.y + ph].join(','))
				.attr({'stroke-width': 0.5, 'stroke': 'pink'});
				
				cs.path(['M', pconf.x, pconf.y + ph*j/100, 
					'H', pconf.x + pw].join(','))
				.attr({'stroke-width': 0.5, 
						'stroke': 'green'});
				
				cs.path(['M', pconf.x, pconf.y + ph*(j+10)/100, 
					'H', pconf.x + pw].join(','))
				.attr({'stroke-width': 0.5, 'stroke': 'pink'});
				
			}
		}

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
				.attr({fill: color, 'stroke-width': 0.5});
			tx.toFront();
		}
		
		// Draw objects
		pconf.objects = {};
		for (name in conf.objects) {
			obj = conf.objects[name];
			if (cleared || obj.hidden) continue;
			pconf.objects[name] = new Actor(cs, 
										obj.type[0], 
										obj.type[1],
										obj.type[2],
										pconf.x + pw * obj.x / 100,
										pconf.y + ph * obj.y / 100,
										obj.type[1],
										obj.type[2]);
		}
		
		// Draw events
		nevents = pconf.events.length;
		for (j = 0; j < nevents; j++) {
			ev = pconf.events[j];
			switch (ev.type) {
				case 'rmove': {
					var obj = conf.objects[ev.at];
					ev.x = parseFloat(obj.x) + parseFloat(ev.x);
					ev.y = parseFloat(obj.y) + parseFloat(ev.y);
					// fallthrough to the next switch case..
				}
				case 'move': {
					var obj = pconf.objects[ev.at];
					obj.move(pconf.x + pw * ev.x / 100, pconf.y + ph * ev.y / 100);
					if (ev.options && ev.options.permanent) {
						conf.objects[ev.at].x = ev.x;
						conf.objects[ev.at].y = ev.y;
					}
					break;
				}
				case 'hide': {
					pconf.objects[ev.at].hide();
					if (ev.options && ev.options.permanent) {
						conf.objects[ev.at].hidden = true;
					}
					break;
				}
				case 'mood': {
					pconf.objects[ev.at].setMood(ev.val);
					if (ev.options && ev.options.permanent) {
						conf.objects[ev.at].type[2] = ev.val;
					}
					break;
				}
				case 'color': {
					pconf.objects[ev.at].setColor(ev.val);
					if (ev.options && ev.options.permanent) {
						conf.objects[ev.at].type[1] = ev.val;
					}
					break;
				}
				case 'show': {
					obj = pconf.objects[ev.at];
					if (obj) {
						obj.show();
					} else {
						obj = conf.objects[ev.at];
						pconf.objects[ev.at] = new Actor(cs, 
													obj.type[0], 
													obj.type[1],
													obj.type[2],
													pconf.x + pw * obj.x / 100,
													pconf.y + ph * obj.y / 100,
													obj.type[1],
													obj.type[2]);
					}
					pconf.objects[ev.at].show();
					if (ev.options && ev.options.permanent) {
						conf.objects[ev.at].hidden = false;
					}
					break;
				}
				case 'send': {
					handle_send(cs, pconf, ph, pw, ev);
					break;
				}
				
				case 'say': {
					handle_say(cs, pconf, pw, ph, ev, j);
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

function drawInput(canvas, width, height, input, design) {
	var conf = ParseText(input);
//console.log(JSON.stringify(conf, null, 4));
	conf.canvas = canvas;
	conf.width = width;
	conf.height = height;
	conf.gap = 10;
	conf.panelw = 210;
	conf.panelh = 160;
	
	conf.design = design;

	drawComics(conf);
	
	var defines = [];
	for (var name in conf.objects) {
		var o = conf.objects[name];
		defines.push(['define', name, 
						o.type[0], 
						o.type[1], o.type[2],
						o.x, o.y,
						o.hidden ? "hidden" : ""].join(' '));
	}
	console.log(defines.join("\n"));
}


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

