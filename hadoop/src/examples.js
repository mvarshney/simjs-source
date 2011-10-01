load('../../src/sim.js');
load('../../src/stats.js');
load('../../src/queues.js');
load('../../src/random.js');
load('../../src/request.js');
load('mapreduce.js');


function mapreduce(data, conf) {
	var sim = new Sim();
	sim.setLogger(print);
	var job = sim.addEntity(JobTracker);
	job.submit(data, conf);
	sim.simulate(1000);
}



var WordCount = {
	nsplits: 2,
	record_sep: ' ',
	nmappers: 2,
	field_sep: null,
	mapper: function (key, value) {
		return [key, 1];
	},
	combiner: function (key, value) {
		return [key, value.length];
	},
	nreducers: 2,
	reducer: function (key, value) {
		return [key, value.length];
	},

	maptime: 1,
	reducetime: 1,
	datarate: 10
};

var data = 'a a b c d e f g h i j k a';
mapreduce(data, WordCount);

var Grep = {
	nsplits: 1,
	record_sep: '\n',
	field_sep: null,
	nmappers: 1,
	nreducers: 1,
	maptime: 1,
	reducetime: 1,
	datarate: 10,

	mapper: function (key, value) {
		if (key.indexOf('this') != -1) {
			return [key, 1];
		}
	}
};


data = "this and that\nof one and all\nto this and beyond\nlast line";

print('--------------------------------');
mapreduce(data, Grep);

