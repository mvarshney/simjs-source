function SplitterModel(view) {
	this.view = view;
	this.prob = 0.5;
	this.dest = [null, null];
	var tooltip = ['Splitting', this.prob*100, '% / ', 100 - (this.prob * 100), '%'].join(' ');
	view.image.attr({title: tooltip});
}

SplitterModel.prototype.jsonify = function () {
	return {prob: this.prob};
};

SplitterModel.prototype.start = function () {
	this.entity = QueueApp.sim.addEntity(SplitterEntity, this.prob);
};

SplitterModel.prototype.connect = function () {
	this.entity.dest1 = this.dest[0] ? this.dest[0].entity : null;
	this.entity.dest2 = this.dest[1] ? this.dest[1].entity : null;
};

SplitterModel.prototype.showSettings = function (x, y) {
	var d = $('#splitter_form');
	QueueApp.form_view = this.view;
	d.find('#splitter_form_perc').val(this.prob);
	
	d.show().position({
		of: $(this.view.image.node),
		at: 'center center',
		my: 'left top'
	});
};

SplitterModel.prototype.saveSettings = function (dialog) {
	var d = $('#splitter_form');
	this.prob = d.find('#splitter_form_perc').val();
	var msg = ['Splitting', this.prob*100, '% / ', 100 - (this.prob * 100), '%'].join(' ');
	this.view.image.attr({title: msg});
};

SplitterModel.prototype.unlink = function () {
	this.view = null;
};

SplitterModel.prototype.showStats = function () {
/*
	var msg = ['In:', this.entity.arrived, 
				'Out [1]:', this.entity.to1,
				'Out [2]:', this.entity.to2].join(' ');
	this.view.counters.attr({text: msg});
*/
};

/*-------------------------*/
var SplitterEntity = {
	start: function (prob) {
		this.prob = prob;
		this.arrived = 0;
		this.to1 = 0;
		this.to2 = 0;
	},
	
	arrive: function (stamp) {
		this.arrived ++;
		var r = QueueApp.random.uniform(0.0, 1.0);
		if (r < this.prob) {
			this.to1 ++;
			if (this.dest1) this.dest1.arrive(stamp);
		} else {
			this.to2 ++;
			if (this.dest2) this.dest2.arrive(stamp);
		}
	}
};