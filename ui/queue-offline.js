load('../src/sim.js');
load('../src/stats.js');
load('../src/queues.js');
load('../src/random.js');
load('../src/request.js');

var model = '{"until":25000,"seed":1234,"version":"1.0","objects":[{"x":139,"y":229,"type":"source","name":"source_1","out":"queue_1","model":{"lambda":0.25}},{"x":259,"y":148,"type":"queue","name":"queue_1","model":{"nservers":1,"mu":1,"infinite":true,"maxqlen":0}}]}';


/***************************************************/

function ServerModel(sim, random) {
	this.nservers = 1;
	this.mu = 1;
	this.infinite = true;
	this.maxqlen = 0;
	this.sim = sim;
	this.random = random;
}

ServerModel.prototype.start = function () {
	this.entity = this.sim.addEntity(ServerEntity, this.random, this.nservers, this.mu);
}

ServerModel.prototype.connect = function (dest) {
	this.entity.dest = dest.entity;
};

ServerModel.prototype.printStats = function (printf) {
	var service = this.entity.facility;
	var qd = service.queueStats().durationSeries;
	var qs = service.queueStats().sizeSeries;
	var sd = service.systemStats().durationSeries;
	var ss = service.systemStats().sizeSeries;
	var usage = service.usage() / this.sim.time() * 100;
	printf("Queue " + this.name);
	printf("\tArrival = " + qd.count());
	printf("\tServer Usage = " + usage.toFixed(2) + "%");
	printf("\tTime spent in queue = " + qd.average().toFixed(3));
	printf("\tTime spent in system = " + sd.average().toFixed(3));
	printf("\tSize of queue = " + qs.average().toFixed(3));
	printf("\tCustomers in system = " + ss.average().toFixed(3));
};


/*-------------------------*/
function SourceModel(sim, random) {
	this.lambda = 0.25;
	this.sim = sim;
	this.random = random;
}

SourceModel.prototype.start = function () {
	this.entity = this.sim.addEntity(SourceEntity, this.random, this.lambda);
};

SourceModel.prototype.connect = function (dest) {
	this.entity.dest = dest.entity;
};

/*-------------------------*/
function SplitterModel() {
	this.prob = 0.5;
	this.sim = sim;
	this.random = random;
}

SplitterModel.prototype.start = function () {
	this.entity = this.sim.addEntity(SplitterEntity, this.random, this.prob);
};

SplitterModel.prototype.connect = function (dest, channel) {
	this.entity.dest[channel] = dest.entity;
};

/*-------------------------*/
function MonitorModel(sim, random) {
	this.sim = sim;
}

MonitorModel.prototype.start = function () {
	this.entity = this.sim.addEntity(MonitorEntity);
};

MonitorModel.prototype.connect = function (dest) {
	this.entity.dest = dest.entity;
};

MonitorModel.prototype.printStats = function (printf) {
	var m = this.entity.monitor;

	printf("Monitor " + this.name);
	printf("\tArrivals = " + m.count().toFixed(3));
	printf("\tInterarrival = " + m.average().toFixed(3));
};

/***************************************************/

var ServerEntity = {
	start: function (random, nservers, mu) {
		this.random = random;
		this.mu = mu;
		this.facility = new Sim.Facility('queue');
	},

	arrive: function (from) {
		var duration = this.random.exponential(this.mu);
		var ro = this.useFacility(this.facility, duration);
		if (this.dest) {
			ro.done(this.dest.arrive, this.dest, this);
		}
	}
};

/*-------------------------*/
var SourceEntity = {
	start: function (random, lambda) {
		this.random = random;
		this.lambda = lambda;
		this.setTimer(0).done(this.traffic);
	},
	
	traffic: function () {
		if (!this.dest) return;

		var duration = this.random.exponential(this.lambda);

		this.setTimer(duration)
		.done(this.dest.arrive, this.dest, this)
		.done(this.traffic);
	}
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

/*-------------------------*/
var SplitterEntity = {
	start: function (random, prob) {
		this.random = random;
		this.prob = prob;
	},
	
	arrive: function () {
		var r = this.random.uniform(0.0, 1.0);
		if (r < this.prob) {
			if (this.dest[0]) this.dest[0].arrive();
		} else {
			if (this.dest[1]) this.dest[1].arrive();
		}
	}
};


function QueueApp(json) {
	var until = 5000, seed = 1234;
	if (json.until) until = json.until;
	if (json.seed) seed = json.seed;

	var sim = new Sim();
	var random = new Random(seed);
	
	var len = json.objects.length;
	var dict = {};
	var ModelFactory = {queue: ServerModel, source: SourceModel, 
						splitter: SplitterModel, monitor: MonitorModel};
						
	for (var i = len - 1; i >= 0; i--) {
		var conf = json.objects[i];
		var model;
		if (conf.type === 'queue') model = new ServerModel(sim, random);
		else if (conf.type === 'source') model = new SourceModel(sim, random);
		else if (conf.type === 'monitor') model = new MonitorModel(sim, random);
		else if (conf.type === 'splitter') model = new SplitterModel(sim, random);
		else throw "Cannot create model for " + conf.name;

		model.name = conf.name;
//		for (prop in conf.model) model[prop] = conf.model[prop];
		dict[conf.name] = model;
		model.start();
	}

	for (var i = len - 1; i >= 0; i--) {
		var conf = json.objects[i];
		if (!conf.out) continue;

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
	
	sim.simulate(until);
	
	for (modelname in dict) {
		var model = dict[modelname];
		if (model.printStats) model.printStats(print);
	}
}

QueueApp(JSON.parse(model));