function MonitorModel(view) {
	this.view = view;
	this.dest = null;
	this.statTable = $('#monitor_stats').clone().attr('id', view.name);
	this.statTable.find('h2').text(view.name);
	
	$("#results").append(this.statTable);
	this.stat = [
		this.statTable.find('#arrival'),
		this.statTable.find('#inter'),
		this.statTable.find('#interd')];
}

MonitorModel.prototype.jsonify = function () {
	return null;
};

MonitorModel.prototype.start = function () {
	this.entity = QueueApp.sim.addEntity(MonitorEntity);
};

MonitorModel.prototype.connect = function () {
	if (this.dest) this.entity.dest = this.dest.entity;
};

MonitorModel.prototype.showStats = function () {
	var m = this.entity.monitor;

	this.stat[0].text(m.count());
	this.stat[1].text(m.average().toFixed(3));
	this.stat[2].text(m.deviation().toFixed(3));
};

MonitorModel.prototype.showSettings = function (x, y) {
	var d = $('#monitor_form');
	QueueApp.form_view = this.view;
	d.dialog('option', {title: this.view.name, position: [x, y]})
	.dialog('open');
};

MonitorModel.prototype.saveSettings = function (dialog) {
};

MonitorModel.prototype.unlink = function () {
	this.statTable.remove();
};

/*-------------------------*/
var MonitorEntity = {
	start: function () {
		this.monitor = new Sim.TimeSeries();
	},
	
	arrive: function () {
		this.monitor.record(1, this.time());
		if (this.dest) this.dest.arrive();
	}
};