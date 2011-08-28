var SimPanel = {
	IntervalLow: 40,
	Interval: 50,
	IntervalHigh: 60,
	EventsPerInterval: 100,
	IntervalPause: 0,
	
	/** Public APIs 
	 */
	load: function (divname) {
		divname = '#' + divname;
		
		// Add gui elements
		$(divname).html(' \
			<input type="button" name="simpanel_play" value="Start Simulation" id="simpanel_play"> \
			<input type="button" name="simpanel_stop" value="Stop Simulation" id="simpanel_stop"> \
			<input type="text" value="5e6" id="simpanel_sim_until"> \
			Simulation Time: <span id="simpanel_sim_time">0</span> \
			Events/Sec: <span id="simpanel_events_per_sec">0</span> \
		');
		
		this.playButton = $(divname + ">#simpanel_play");
		this.stopButton = $(divname + ">#simpanel_stop");
		this.simUntilInput = $(divname + ">#simpanel_sim_until");
		this.simTimeDisplay = $(divname + ">#simpanel_sim_time");
		this.eventsSecDisplay = $(divname + ">#simpanel_events_per_sec");
		
		// Add handlers
		this.playButton.click(this.play);
		this.stopButton.click(this.stop);
		
		// Disable some fields
		this.stopButton.hide();
		this.simUntilInput.show();
		this.simTimeDisplay.hide();
		this.eventsSecDisplay.hide();
		
		this.playing = false;
		this.paused = false;
		
		return this;
	},
	
	onPlay: function (cb) {
		this.onPlayCallback = cb;
	},
	
	onPause: function (cb) {
		this.onPauseCallback = cb;
	},
	
	/** Programmatic APIs.
	 * These will be called by Panel UI.
	 */
	
	play: function (event) {
		var sp = SimPanel;

		if (sp.playing) {
			if (sp.paused) {
				return sp.resume();
			}
			return sp.pause();
		}
		
		if (sp.onPlayCallback) {
			if (!sp.onPlayCallback()) return;
		}
		
		if (!sp.sim) {
			alert("Simulation object is not configured");
			return;
		}
		
		sp.playButton.val("Pause Simulation");
		sp.stopButton.show();
		sp.simUntilInput.hide();
		sp.simTimeDisplay.show();
		sp.eventsSecDisplay.show();
		
		sp.playing = true;
		
		sp.until = sp.simUntilInput.val();
		sp.startedAt = new Date().getTime();
		sp.run();
	},
	
	pause: function () {
		SimPanel.playButton.val("Resume Simulation");		
		SimPanel.paused = true;
	},
	
	resume: function () {
		var sp = SimPanel;
		sp.playButton.val("Pause Simulation");
		sp.paused = false;
		sp.run();
	},
	
	stop: function () {
		var sp = SimPanel;
		
		sp.playing = false;
		sp.paused = false;
		
		sp.playButton.val("Start Simulation");		
		sp.stopButton.hide();
		sp.simUntilInput.show();
		sp.simTimeDisplay.hide();
		sp.eventsSecDisplay.hide();
	},
	
	// 0: stopped, 1: playing, 2: paused
	getRunStatus: function () {
		
	},
	
	setMode: function (mode) {
		
	},
	
	getMode: function () {
		
	},
	
	/*** private API */
	run: function () {
		var sp = SimPanel;
		var start = new Date().getTime();
		var completed = sp.sim.simulate(sp.until, sp.EventsPerInterval);
		var end = new Date().getTime();
		
		sp.simTimeDisplay.text(sp.sim.time());
		var eventsPerSec = sp.EventsPerInterval / (end - start) * 1000;
		sp.eventsSecDisplay.text(end - sp.startedAt);
	//	sp.eventsSecDisplay.append([end-start, end-sp.startedAt, sp.EventsPerInterval, "]"].join(", "));
		
		var diff = end - start;
		if (diff < sp.IntervalLow || diff > sp.IntervalHigh) {
			sp.EventsPerInterval = Math.floor(sp.EventsPerInterval / diff * sp.Interval);
		}
		
		if (completed) {
			return;
		}
		
		if (!sp.playing) {
			return;
		}
		
		if (sp.paused) {
			return;
		}
		
		setTimeout(sp.run, sp.IntervalPause);
	}
};


