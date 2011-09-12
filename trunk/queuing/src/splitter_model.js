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
	if (this.dest[0]) {
		this.entity.dest1 = this.dest[0].entity;
	}
	
	if (this.dest[1]) {
		this.entity.dest2 = this.dest[1].entity;
	}
};

SplitterModel.prototype.showSettings = function (x, y) {
	var d = $('#splitter_form');
	QueueApp.form_view= this.view;
	d.find('#splitter_form_perc').val(this.lambda);
	
	d.dialog('option', {title: this.view.name, position: [x, y]})
	.dialog('open');
};

SplitterModel.prototype.saveSettings = function (dialog) {
	var d = $('#splitter_form');
	this.lambda = d.find('#splitter_form_perc').val();
	$('#log').append('perc for ' + this.view.name + " is " + this.lambda);
};

SplitterModel.prototype.unlink = function () {

};


/*-------------------------*/
var SplitterEntity = {
	start: function (prob) {
		this.prob = prob;
	},
	
	arrive: function () {
		var r = QueueApp.random.uniform(0.0, 1.0);
		if (r < this.prob) {
			if (this.dest1) this.dest1.arrive();
		} else {
			if (this.dest2) this.dest2.arrive();
		}
	}
};