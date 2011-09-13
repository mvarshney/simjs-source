function SourceModel(view) {
	this.view = view;
	this.lambda = 0.25;
	this.dest = null;
	view.image.attr({title: 'Rate = ' + 1 / this.lambda});
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

SourceModel.prototype.showSettings = function (x, y) {
	var d = $('#source_form');
	QueueApp.form_view = this.view;
	d.find('#source_form_rate').val(this.lambda);
	
	d.dialog('option', {title: this.view.name, position: [x, y]})
	.dialog('open');
};

SourceModel.prototype.saveSettings = function (dialog) {
	var d = $('#source_form');
	this.lambda = d.find('#source_form_rate').val();
	$('#log').append('rate for ' + this.view.name + " is " + this.lambda);
	this.view.image.attr({title: 'Rate = ' + 1 / this.lambda});
};

SourceModel.prototype.unlink = function () {
	
};

SourceModel.prototype.showStats = function () {
	this.view.showCounters(NaN, this.entity.generated);
};

/*-------------------------*/
var SourceEntity = {
	start: function (lambda) {
		this.lambda = lambda;
		this.setTimer(0).done(this.traffic);
		this.generated = -1;
	},
	
	traffic: function () {
		this.generated ++;
		if (!this.dest) return;

		var duration = QueueApp.random.exponential(this.lambda);

		this.setTimer(duration)
		.done(this.dest.arrive, this.dest, this)
		.done(this.traffic);
		

	}
};