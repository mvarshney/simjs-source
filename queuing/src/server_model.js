function ServerModel(view) {
	this.view = view;
	this.nservers = 1;
	this.mu = 1;
	this.infinite = true;
	this.maxqlen = 0;
	
	this.entity = null;
	this.dest = null;
	this.statTable = $('#server_stats').clone().attr('id', view.name);
	this.statTable.find('h2').text(view.name);
	
	$("#results").append(this.statTable);
	this.stat = [
		this.statTable.find('#arrival'),
		this.statTable.find('#sutil'),
		this.statTable.find('#qtime'),
		this.statTable.find('#stime'),
		this.statTable.find('#qsize'),
		this.statTable.find('#ssize'),
		this.statTable.find('#qtimed'),
		this.statTable.find('#stimed'),
		this.statTable.find('#qsized'),
		this.statTable.find('#ssized')
	];
	
	this.view.image.attr({title: 'Service time = ' + 1 / this.mu});
}

ServerModel.prototype.jsonify = function () {
	return {
		nservers: this.nservers,
		mu: this.mu,
		infinite: this.infinite,
		maxqlen: this.maxqlen
	};
};

ServerModel.prototype.start = function () {
	this.entity = QueueApp.sim.addEntity(ServerEntity, this.nservers, this.mu);
	
};

ServerModel.prototype.connect = function () {
	this.entity.dest = this.dest ? this.dest.entity : null;
};

ServerModel.prototype.showSettings = function (x, y) {
	var d = $('#server_form');
	QueueApp.form_view = this.view;
	d.find('#server_form_rate').val(1 / this.mu);
	d.show().position({
		of: $(this.view.settings.node),
		at: 'right bottom',
		my: 'left top'
	});
};

ServerModel.prototype.saveSettings = function (dialog) {
	var d = $('#server_form');
	this.mu = 1 / d.find('#server_form_rate').val();
	this.view.image.attr({title: 'Service time = ' + 1 / this.mu});
};

ServerModel.prototype.showStats = function () {
	var service = this.entity.facility;
	var qd = service.queueStats().durationSeries;
	var qs = service.queueStats().sizeSeries;
	var sd = service.systemStats().durationSeries;
	var ss = service.systemStats().sizeSeries;
	var usage = service.usage() / QueueApp.sim.time() * 100;
	this.stat[0].text(qd.count());
	this.stat[1].text(usage.toFixed(1) + "%");
	this.stat[2].text(qd.average().toFixed(3));
	this.stat[3].text(sd.average().toFixed(3));
	this.stat[4].text(qs.average().toFixed(3));
	this.stat[5].text(ss.average().toFixed(3));
	this.stat[6].text(qd.deviation().toFixed(3));
	this.stat[7].text(sd.deviation().toFixed(3));
	this.stat[8].text(qs.deviation().toFixed(3));
	this.stat[9].text(ss.deviation().toFixed(3));
	
	this.view.showCounters(qd.count(), sd.count());
};

ServerModel.prototype.unlink = function () {
	this.statTable.remove();
	this.view = null;
	this.stat = null;
}

/***************************************************/

var ServerEntity = {
	start: function (nservers, mu) {
		this.mu = mu;
		this.facility = new Sim.Facility('queue');
	},

	arrive: function (stamp) {
		var duration = QueueApp.random.exponential(this.mu);
		var ro = this.useFacility(this.facility, duration);
		if (this.dest) {
			ro.done(this.dest.arrive, this.dest, stamp);
		}
	}
};