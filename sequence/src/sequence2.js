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

	function say(at, msg, options) {
		cPanel.events.push({
			type: 'say', at: at, msg: msg, options: options});
	}

	function send(at, to, msg, options) {
		cPanel.events.push({
			type: 'send', at: at, to: to, msg: msg, options: options});
	}
	
	function hide(at) {
		cPanel.events.push({type: 'hide', at: at});
	}
	
	function show(at) {
		cPanel.events.push({type: 'show', at: at});
	}

	new Function ('define', 'panel', 'say', 'send', 'hide', 'show', str)
			(define, panel, say, send, hide, show);

	return conf;
}


function model() {
	define('A', 'host', 60, 20, 80);
	define('B', 'host', 60, 80, 20);
	define('M', 'host', 60, 20, 20);
	panel();
	hide('M');
	say('A', 'I am the attacker.<br>I will launch<br>substitution attack', {position: 'right'});
	say('B', 'I am the victim!! :(', {position: 'left'})
	panel();
	send('A', 'B', 'our normal messages');
	panel();
	say('M', "I am the <br><b>Man in the Middle</b>", {position: 'right'});
	
	panel();
	send('A', 'M', 'redirected');
	send('M', 'B', 'changed');
}


function createPanel (conf, index) {
	var pconf = conf.panels[index];
	pconf.objects = {};
	
	// Create panel
	var p = $("<div class='panel'></div>").appendTo(conf.page).attr('id', pconf.name);

	var w = p.width(), h = p.height();
	
	// Add objects
	for (var name in conf.objects) {
		var oconf = conf.objects[name];
		var icon = Icons[oconf.type];
		if (!icon) throw "Object type " + oconf.type + " is not supported";
		
		var o = $('<img src="' + icon.img + '"></img>')
			.attr('id', pconf.name + '_' + name)
			.width(icon.w * oconf.scale / 100)
			.height(icon.h * oconf.scale / 100)
			.appendTo(p)
			.position({
				of: p,
				my: 'center center',
				at: 'left top',
				offset: [oconf.x /100 * w, oconf.y / 100 * h].join(' ')
			});
		
		pconf.objects[name] = o;
	}
	
	// Display events
	var nevents = pconf.events.length;
	for (var i = 0; i < nevents; i++) {
		var ev = pconf.events[i];
		switch (ev.type) {
			case 'hide': {
				pconf.objects[ev.at].hide();
				break;
			}
			case 'say': {
				var position, align, pointer;
				
				if (ev.options) {
					position = ev.options.position;
					align = ev.options.align;
					pointer = ev.options.pointer;
				}
				if (!position) position = 'top';
				if (!align) align = 'center';
				if (!pointer) pointer = 'center';
				
				pconf.objects[ev.at].callout({
					msg: ev.msg,
					position: position,
					align: align,
					pointer: pointer
				});
				break;
			}
			case 'send': {
				var from = pconf.objects[ev.at];
				var to = pconf.objects[ev.to];
				jsPlumb.connect({
					source: from.attr('id'),
					target: to.attr('id'),
					endpoint:[ "Dot", { radius:1 } ],
					connector:[ "Bezier", { curviness:50}],
					anchors: ["TopCenter", "LeftMiddle"],
					overlays: [
						['Arrow', {location: 1}],
						['Label', {label: ev.msg, cssClass: 'message'}]]
				});
				break;
			}
		}
	}
}

var prevText = "";
function redraw() {
	setTimeout(redraw, 3000);
	var text = $('#input').val();
	if (text === prevText) return;

	prevText = text;
	try {
		var conf = Parse(text);
	
	} catch (e) {
		return;
	}
	try {
		var i, panel, npanels = conf.panels.length;
		conf.page = $('#page');
	$('#page').empty();
	$('.callout_main').remove();
		// Create panels
		for (i = 0; i < npanels; i++) {
			createPanel(conf, i);
		}
	} catch (e) {
		
	}
}

$(function () {
	// jsPlumb defaults
	jsPlumb.Defaults.EndPoint = "dot";
	jsPlumb.Defaults.PaintStyle = {
		lineWidth:2,
		strokeStyle: 'rgba(200,0,0,100)'
	}
	jsPlumb.Defaults.Endpoints = [ [ "Dot", 1 ], [ "Dot", 1 ] ];

	
	var a = model.toString().split("\n");
	a[0] = null;
	a[a.length - 1] = null;
	modelstr = a.join("\n");
	var conf = Parse(modelstr);
	
	var i, panel, npanels = conf.panels.length;
	conf.page = $('#page');
	
	// Create panels
	for (i = 0; i < npanels; i++) {
		createPanel(conf, i);
	}
	
	/*
	var a = $('<img id="img1" src="images/host.png" width="32px"></img>')
		.appendTo('#panel1')
		.position({
			of: $('#panel1'),
			my: 'left top',
			at: 'left top',
			offset: '10 130'
		});
	var b = $('<img id="img2" src="images/host.png" width="32px"></img>')
			.appendTo('#panel1')
			.position({
				of: $('#panel1'),
				my: 'left top',
				at: 'left top',
				offset: '160 10'
			});
	
	// http://yacop.alepe.com/
	a.callout({msg: 'I am attacker<br>I will ',
				align: 'left', pointer: 'left'});
	b.callout({msg: 'I am victim<br> anda flkjaslfk alskfjskljf', 
			position: 'left', align: 'top', pointer: 'top'});
			var common = {
				cssClass:"myCssClass"
			};
	// http://jsplumb.org/doc/usage.html
	jsPlumb.EndPoint = "dot";
	jsPlumb.Defaults.PaintStyle = {
		lineWidth:2,
		strokeStyle: 'rgba(200,0,0,100)'
	}

	
	jsPlumb.connect({
		source: "img1",
		target:"img2",
		endpoint:[ "Dot", { radius:1 } ],
		connector:[ "Bezier", { curviness:50}],
		anchors: ["BottomRight", "LeftMiddle"]
	});
	*/
});


