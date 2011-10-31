
function Parse(str) {

	conf = {version: 1, objects: {}, panels: []};
	cPanel = null;

	function define(name, type, scale, x, y, hidden) {
		conf.objects[name] = {type: type, scale: scale, x: x, y: y, hidden: hidden};
	}

	function panel(msg, notes, options) {
		cPanel = {type: 'single', 
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
		CurrentPanel.events.push({
			type: 'send', to: to, msg: msg, options: options});
	}

	new Function ('define', 'panel', 'say', 'send', str)(define, panel, say, send);

	return conf;
}


/*
define('a', 'host', 100, 10, 10, false)
panel(msg, gui);
say('a', msg, gui);
send('a', 'b', msg, gui);
if (msg);
	..
else(msg);
	..
end();

loop(msg);
	say(a, msg);
end();
par();
...
end();



say a hello world
send a b 
a: a
a -> b: a
loop text outside
	a: a
end

if x outside
	a: a
	b: b
end

par
end

panel [] {notes}


conf = {
	version: 1,
	objects: {
		name: {type: type, scale: scale, x: x, y: y}
	},
	{type: message, at: name, to: name, msg: msg, options: options},
	{type: info, at: name_or_array_or_null, msg: msg, options: options},
	{type: if, msg: msg, events: [], elsemsg: msg, elseevents: [], options: options}
	{type: loop, msg: msg, events: [], options: options}
	{type: parallel, msg: msg, events: [], options: options}
	{type: hide, at: name}
	{type: show, at: name}
	
	
	panels: [
		{name: name, type: single, events: [], options: options, parent: panel, notes: notes},
		{name: name, type: group, subtype: if|else|loop, msg: msg, panels: [], parent: panel}
	]
}

*/