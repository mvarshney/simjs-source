function SinkModel(view) {
	this.view = view;
	this.entity = null;

	this.statTable = $('#sink_stats').clone().attr('id', view.name);
	this.statTable.find('h2').text(view.name);
	
	$("#results").append(this.statTable);
	this.stat = [
		this.statTable.find('#depart'),
		this.statTable.find('#pop'),
		this.statTable.find('#popd'),
		this.statTable.find('#stay'),
		this.statTable.find('#stayd')
	];
}

SinkModel.prototype.jsonify = function () {
	return null;
};

SinkModel.prototype.start = function () {
	this.entity = QueueApp.sim.addEntity(SinkEntity);
	
};

SinkModel.prototype.connect = function () {
	
};

SinkModel.prototype.showSettings = function (x, y) {
	var d = $('#sink_form');
	QueueApp.form_view = this.view;
	d.show().position({
		of: $(this.view.image.node),
		at: 'center center',
		my: 'left top'
	});
};

SinkModel.prototype.saveSettings = function (dialog) {

};

SinkModel.prototype.showStats = function () {
	var p = this.entity.population;
	this.stat[0].text(p.durationSeries.count());
	this.stat[1].text(p.sizeSeries.average().toFixed(3));
	this.stat[2].text(p.sizeSeries.deviation().toFixed(3));
	this.stat[3].text(p.durationSeries.average().toFixed(3));
	this.stat[4].text(p.durationSeries.deviation().toFixed(3));
	
	this.view.showCounters(p.durationSeries.count(), NaN);
};

SinkModel.prototype.unlink = function () {
	this.statTable.remove();
	this.view = null;
	this.stat = null;
}

/***************************************************/

var SinkEntity = {
	start: function () {
		this.population = new Sim.Population();
	},

	arrive: function (stamp) {
		if (!stamp) stamp = 0;
		this.population.enter(stamp);
		this.population.leave(stamp, this.time());
	}
};