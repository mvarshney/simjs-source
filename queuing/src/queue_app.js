var QueueApp = {
	init: function () {
		this.canvas = Raphael("canvas", 600, 400);
		

		
		// File menu
		$( "#new_file" ).button({text: false, icons: {primary: "ui-icon-document"}})
		.click(function () {
			QueueApp.reset();
		});
		
		$( "#load_file" ).button({text: false, icons: {primary: "ui-icon-folder-open"}})
		.click(function () {
			QueueApp.load();
		});
		$( "#save_file" ).button({text: false,icons: {primary: "ui-icon-disk"}})
		.click(function () {
			QueueApp.save();
		});
		$("#file_ops").buttonset();

		$('#verify_clear').dialog({
			autoOpen: false,
			width: 250,
			modal: true,
			resizable: false,
			buttons: {
				'Cancel': function () {
					$(this).dialog('close');
				},
				'Ok': function () {
					$(this).dialog('close');
					QueueApp.reset(true);
				}
			}
		});

		$('#save_dialog').dialog({
			autoOpen: false,
			width: 450,
			modal: true,
			resizable: false
		});
		
		$('#load_dialog').dialog({
			autoOpen: false,
			width: 450,
			modal: true,
			resizable: false,
			buttons: {
				'Cancel': function () {
					$(this).dialog('close');
				},
				'Load': function () {
					$(this).dialog('close');
					QueueApp.reset(true);
					QueueApp.loadtext($('#load_textarea').val());

				}

			}
		});
		
		// Simulation menu
		$("#play_sim").button({icons: {primary: "ui-icon-play"}}).click(function () {
			QueueApp.startSim();
		});
		$("#config_sim").button({icons: {primary: "ui-icon-clock"}}).click(function () {
			QueueApp.showSimProperties();
		});
		$("#sim_ops").buttonset();
		
		// buttons that are shown when simulation is running
		$("#pause_sim").button({text: false, icons: {primary: "ui-icon-pause"}}).click(function () {
			if (QueueApp.paused) {
				QueueApp.paused = false;
				$('#pause_sim').button('option', 'icons', {primary: 'ui-icon-pause'});
				QueueApp.run();
			} else {
				$('#pause_sim').button('option', 'icons', {primary: 'ui-icon-play'});
				QueueApp.paused = true;
			}
		});
		
		$("#stop_sim").button({text: false, icons: {primary: "ui-icon-stop"}}).click(function () {
			QueueApp.playing = false;
			if (QueueApp.paused) {
				QueueApp.complete();
			}
		});
		
		$("#sim_play_ops").buttonset().hide();
		
		this.progress = $("#progressbar");
		this.progress.progressbar().hide();

		// settings window
		$('.settings_form_delete').button({icons: {primary: 'ui-icon-trash'}})
		.click(function () {
			QueueApp.form_view.unlink();
			$(this).parent().hide();
		})

		$('.settings_form_disconnect').button()
		.click(function () {
			QueueApp.form_view.disconnect();
			$(this).parent().hide();
		});

		$('.settings_form_save').button()
		.click(function () {
			QueueApp.form_view.model.saveSettings();
			$(this).parent().hide();
		});
		
		$('.settings_form').hide();

		$( ".settings_form_close" ).button({icons: {primary: "ui-icon-close"},text: false})
		.click(function () {
			$(this).parent().hide();
		});
		
		$('#simulation_dialog_save').button().click(function () {
			$(this).parent().hide();
			QueueApp.saveSettings();
		});
		
		this.reset();
	},
	
	reset: function (dontask) {
		if (!dontask && this.views && this.views.length != 0) {
			$('#verify_clear').dialog('open');
			return;
		}
		
		// Delete data from old run, if present
		var len, i;
		
		if (this.models) {
			len = this.models.length;
			for (i = len - 1; i >= 0; i --) {
				if (this.models[i].unlink) this.models[i].unlink();
			}
		}
		
		this.sim = null;
		this.until = 3600 * 8;
		this.seed = 1234;
		this.showConn = false;
		this.server_id = 0;
		this.source_id = 0;
		this.splitter_id = 0;
		this.sink_id = 0;
		
		this.canvas.clear();
		this.posx = 100;
		this.posy = 50;
		this.views = [];
		this.models = [];
		this.form_view = null;
		
		this.canvas.rect(0, 0, 600, 400).attr({fill: '#FAF6AA', 'fill-opacity': '.6'});
		
		var a = [];
		for (var i = 0; i <= 600; i+= 50) {
			a.push("M" + i + " 0L" + i + " 400");
			a.push("M0 " + i + "L600 " + i);
		}
		var l1 = this.canvas.path(a.join(""));
		l1.attr({'stroke-width': 0.5, 'stroke': 'pink'});
		this.canvas.path("M0 0L0 400L600 400L600 0L0 0")
		.attr({'stroke-width': 4, 'stroke': 'pink'});
		

		for (var i = 0; i < 4; i ++) {
			this.canvas.rect(10, 10 + 50 * i, 50, 50)
			.attr({fill: '#FAF6AA', 'fill-opacity': '50', stroke: 'F7D68A'});
		}
		
		var t = this.parseTime(this.until);
		$('#config_sim').button('option', 'label', t[0].toFixed(3) + " " + t[1]);

		var q = this.canvas.image("images/server.png", 12, 25, 46.4, 22);
		var s = this.canvas.image("images/customers.png", 15, 70, 34, 34);
		var sp = this.canvas.image("images/splitter.png", 15, 115, 41*0.9, 48*0.9);
		var si = this.canvas.image("images/door_out.png", 18, 165, 32, 32);
		q.attr({title: 'Drag and drop to create a new Queue'});
		s.attr({title: 'Drag and drop to create a new Source'});
		sp.attr({title: 'Drag and drop to create a new Splitter'});
		si.attr({title: 'Drag and drop to create a new Sink'});
		
		function setDragger(obj, origx, origy, fn) {
			obj.drag(	
				function (dx, dy) {
					var x = this.ox + dx;
					var y = this.oy + dy;
					if (x < 0 || x > 560 || y < 0 || y > 360) return;
					this.attr({x: this.ox + dx, y: this.oy + dy});
				},
				function () {
					this.ox = this.attr('x');
					this.oy = this.attr('y');
				},
				function () {
					var x = this.attr('x');
					var y = this.attr('y');
					this.attr({x: origx, y: origy});
					if (x < 60 && y < 200) {x = null; y = null;}
					fn.call(QueueApp, x, y);
				});
		}
		
		setDragger(q, 12, 25, QueueApp.newServer);
		setDragger(s, 15, 70, QueueApp.newSource);
		setDragger(sp, 15, 115, QueueApp.newSplitter);
		setDragger(si, 18, 165, QueueApp.newSink);
		
		$('#about_this_model').hide();
	},
	
	updateDrop: function () {
		this.posx += 20;
		this.posy += 20;
		if (this.posy > 360) {
			this.posy = 20;
			this.posx -= 200;
		}
	},
	
	newView: function (ViewFn, ModelFn, type, name, hasIn, hasOut, x, y) {
		if (!x) {
			x = this.posx;
			y = this.posy;
			this.updateDrop();
		}
		var obj = new ViewFn(this.canvas, type, name, x, y, hasIn, hasOut);
		if (this.showConn) obj.showDots(true);
		this.views.push(obj);
		
		var model = new ModelFn(obj);
		obj.model = model;
		this.models.push(model);
		return obj;
	},
	
	newServer: function (x, y) {
		this.server_id++;
		return this.newView(ImageView, ServerModel, 'queue', 
			'queue_' + this.server_id, true, true, x, y);
	},
	
	newSource: function (x, y) {
		this.source_id++;
		return this.newView(ImageView, SourceModel, 
			'source', 'source_' + this.source_id, false, true, x, y);		
	},
	
	newSink: function (x, y) {
		this.sink_id ++;
		return this.newView(ImageView, SinkModel,
				'sink', 'sink_' + this.sink_id, true, false, x, y);
	},
	
	newSplitter: function (x, y) {
		this.splitter_id ++;
		return this.newView(SplitterView, SplitterModel, 
					'splitter', 'splitter_' + this.splitter_id, true, true, x, y);
	},
	
	toggleConnections: function () {
		this.showConn = !this.showConn;
		var len = this.views.length;
		for (var i = len - 1; i >= 0; i--) {
			var obj = this.views[i];
			obj.showDots(this.showConn);
		}
	},
	
	save: function () {
		var str = this.stringify();
		$('#save_dialog').dialog('open');
		$('#save_textarea').text(str).focus().select();
	},
	
	load: function () {
		$('#load_textarea').text('');
		$('#load_dialog').dialog('open');	
	},
	
	loadtext: function (text) {
		try {
			var json = JSON.parse(text);
		} catch (e) {
			
		}
		if (json.seed) this.seed = json.seed;
		if (json.until) this.until = json.until;
		var t = this.parseTime(this.until);
		$('#config_sim').button('option', 'label', t[0].toFixed(3) + " " + t[1]);
		
		
		var len = json.objects.length;
		var dict = {};
		for (var i = len - 1; i >= 0; i--) {
			var conf = json.objects[i];
			var obj = null;

			if (conf.type === 'queue') {
				obj = this.newServer();
			} else if (conf.type === 'source') {
				obj = this.newSource();
			} else if (conf.type === 'splitter') {
				obj = this.newSplitter();
			} else if (conf.type === 'sink') {
				obj = this.newSink();
			}
			
			if (conf.model) {
				for (prop in conf.model) obj.model[prop] = conf.model[prop];
			}
			obj.moveto(conf.x, conf.y);
			obj.name = conf.name;
			dict[conf.name] = obj;
		}
		
		for (var i = len - 1; i >= 0; i--) {
			var conf = json.objects[i];
			if (conf.out) {
				var from = dict[conf.name];
				if (!from) continue;
				
				if (conf.out instanceof Array) {
					for (var j = conf.out.length - 1; j >= 0; j--) {
						var to = dict[conf.out[j]];
						if (to) from.connect(to, j);
					}
				} else {
					var to = dict[conf.out];
					if (to) from.connect(to);
					
				}
			}
		}
	},
	
	stringify: function () {
		var json = {
			until: this.until,
			seed: this.seed,
			version: '1.0',
			objects: []
		};
		var len = this.views.length;
		for (var i = len - 1; i >= 0; i--) {
			json.objects.push(this.views[i].jsonify());
		}
		return JSON.stringify(json);
	},
	
	parseTime: function () {
		if (this.until > 3600) { 
			return [this.until / 3600, "hours"]; 
		} else {
			if (this.until > 60) return [this.until / 60, "mins"];
			else return [this.until, "secs"];
		}
	},
	
	showSimProperties: function () {
		var t = this.parseTime();
		var d = $('#simulation_dialog');
		d.find('#sim_seed').val(this.seed);
		d.find('#sim_until').val(t[0]);
		d.find('#time_selector').val(t[1]);
		d.show().position({
			of: $('#config_sim'),
			at: 'left bottom',
			my: 'left top'
		});
	},
	
	saveSettings: function () {
		var d = $('#simulation_dialog');
		this.until = 1 * d.find('#sim_until').val();
		this.seed = 1 * d.find('#sim_seed').val();
		var mult = d.find('#time_selector').val();
		if (mult === 'hours') this.until *= 3600;
		else if (mult === 'mins') this.until *= 60;
		
		var t = this.parseTime();
		$('#config_sim').button('option', 'label', t[0].toFixed(3) + ' ' + t[1]);
	},

	startSim: function () {
		var len, i, model;
		this.sim = new Sim();
		this.random = new Random(1234);
		
		$("#progressbar").toggle();
		$("#sim_play_ops").toggle();
		$("#new_ops").toggle();
		$("#file_ops").toggle();
		$("#sim_ops").toggle();
		
		$('#about_this_model').accordion('activate', false);
		
		len = this.models.length;
		for (i = len - 1; i >= 0; i --) {
			this.models[i].start();
		}
		
		for (i = len - 1; i >= 0; i --) {
			this.models[i].connect();
		}
		
		this.playing = true;
		this.paused = false;
		this.startedAt = new Date().getTime();
		this.run();
	},

	IntervalLow: 40,
	Interval: 50,
	IntervalHigh: 60,
	EventsPerInterval: 100,
	IntervalPause: 0,

	run: function () {
		var app = QueueApp;
		var start = new Date().getTime();
		var completed = app.sim.simulate(app.until, app.EventsPerInterval);
		var end = new Date().getTime();
		
//		sp.simTimeDisplay.text(sp.sim.time());
//		var eventsPerSec = sp.EventsPerInterval / (end - start) * 1000;
//		sp.eventsSecDisplay.text(end - sp.startedAt);
	//	sp.eventsSecDisplay.append([end-start, end-sp.startedAt, sp.EventsPerInterval, "]"].join(", "));
		
		var diff = end - start;
		if (diff < app.IntervalLow || diff > app.IntervalHigh) {
			app.EventsPerInterval = Math.floor(app.EventsPerInterval / diff * app.Interval);
		}
		
		app.progress.progressbar({value: app.sim.time() * 100 / app.until});
		
		if (completed) {
			QueueApp.complete();
			return;
		}
		
		if (!app.playing) {
			QueueApp.complete();
			return;
		}
		
		if (app.paused) {
			QueueApp.pauseSim();
			return;
		}
		
		setTimeout(app.run, app.IntervalPause);
	},
	
	complete: function () {
		$("#progressbar").toggle();
		$("#sim_play_ops").toggle();
		$("#new_ops").toggle();
		$("#file_ops").toggle();
		$("#sim_ops").toggle();
		
		
		for (var i = QueueApp.models.length - 1; i >= 0; i--){
			var model = QueueApp.models[i];
			if (model.showStats) model.showStats();
		}
	},
	
	pauseSim: function () {
		for (var i = QueueApp.models.length - 1; i >= 0; i--) {
			var model = QueueApp.models[i];
			if (model.showStats) model.showStats();
		}
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