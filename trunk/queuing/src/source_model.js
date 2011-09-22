function SourceModel(view) {
	this.view = view;
	this.lambda = 0.25;
	this.dest = null;
	this.view.image.attr({title: 'Interarrival rate = ' + this.lambda});
}

SourceModel.prototype.jsonify = function () {
	return {
		lambda: this.lambda
	};
};

SourceModel.prototype.start = function () {
	this.entity = QueueApp.sim.addEntity(SourceEntity, this.lambda);
};

SourceModel.prototype.connect = function () {
	this.entity.dest = this.dest ? this.dest.entity : null;
};

SourceModel.prototype.showSettings = function () {
	var d = $('#source_form');
	QueueApp.form_view = this.view;
	d.find('#source_form_rate').val(this.lambda);
	
	d.show().position({
		of: $(this.view.image.node),
		at: 'center center',
		my: 'left top'
	});
};

SourceModel.prototype.saveSettings = function (dialog) {
	var d = $('#source_form');
	this.lambda = d.find('#source_form_rate').val();
	this.view.image.attr({title: 'Interarrival rate = ' + this.lambda});
};

SourceModel.prototype.unlink = function () {
	this.view = null;
};

SourceModel.prototype.showStats = function () {
	this.view.showCounters(NaN, this.entity.generated);
};

/*-------------------------*/
var SourceEntity = {
	start: function (lambda) {
		this.lambda = lambda;
		this.setTimer(0).done(this.traffic);
		this.generated = 0;
	},
	
	traffic: function () {
		if (!this.dest) return;
		this.dest.arrive(this.time());

		this.generated ++;
		
		var duration = QueueApp.random.exponential(this.lambda);

		this.setTimer(duration).done(this.traffic);
	}
};