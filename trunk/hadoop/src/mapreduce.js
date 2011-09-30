load('../../src/sim.js');
load('../../src/stats.js');
load('../../src/queues.js');
load('../../src/random.js');
load('../../src/request.js');

String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash < 0 ? -hash: hash;
}


function split(data, nsplits, separator) {
	var len = data.length;
	var size = Math.floor(data.length / nsplits); 
	var splits = [];
	var start = 0, end = -1, after, before;

	if (separator === undefined) separator = ' ';

	for (var i = nsplits - 1; i > 0; i--) {
		after = data.indexOf(separator, start + size);
		before = data.lastIndexOf(separator, start + size);

		if (after === -1) {
			end = before;
		} else if (before === -1) {
			end = after;
		} else {
			if ((after - start - size) > (start + size - before)) {
				end = before;
			} else {
				end = after;
			}
		}

		if (end === -1) {
			return [];
		} else {
			splits.push(data.substr(start, end - start));
		}

		start = end + separator.length;
		end = -1;
	}

	// the last split takes all
	splits.push(data.substr(start, len - start));

	return splits;
}

function assignToMappers(splits, nmappers) {
	var assigns = Array(nmappers);
	var nsplits = splits.length;
	/* splits per mapper */
	var persplits = Math.floor(nsplits / nmappers); 

	for (var i = 0; i < nmappers - 1; i++) {
		assigns[i] = splits.slice(i * persplits, (i + 1) * persplits);
	}

	// the last takes all
	assigns[i] = splits.slice((nmappers - 1) * persplits);

	return assigns;
}

/*
function MapSplit(split, mapper, record_sep, field_sep) {
	var records = split.split(record_sep);
	var nrecords = records.length;
	var results = [];
	for (var i = 0; i < nrecords; i++) {
		var kv = records[i].split(field_sep);
		results.push(mapper(kv[0], kv[1]));
	}

	return results;
}


function PartitionAndSort(inter, npartitions) {
	var partitions = [];
	var len = inter.length;
	var dict = {};
	var key, val, i, hash;

	for (i = 0; i < npartitions; i++) {
		partitions[i] = [];
	}

	for (i = 0; i < len; i++) {
		key = inter[i][0];
		val = inter[i][1];
		if (!dict[key]) {
			dict[key] = [val];
		} else {
			dict[key].push(val);
		}
	}

	for (key in dict) {
		hash = key.hashCode() % npartitions;
		partitions[hash].push([key, dict[key]]);
	}

	for (i = 0; i < npartitions; i++) {
		partitions[i].sort(function (a, b) {
			return a[0] < b[0] ? -1 : 1;
		});
	}

	return partitions;
}

function Combine(partition, combiner) {
	var len = partition.length;
	for (var i = 0; i < len; i++) {
		var key = partition[i][0];
		var val = partition[i][1];
		partition[i] = combiner(key, val);
	}
}

function MapReduce(data, conf) {
	var splits = split(data, conf.nsplits, conf.record_sep);
	var assigns = assignToMappers(splits, conf.nmappers);
	var len = assigns[0].length;

	for (var i = 0; i < len; i++) {
		var inter = MapSplit(assigns[0][i], conf.mapper, conf.record_sep, conf.field_sep);
		var partitions = PartitionAndSort(inter, conf.nreducers);

		print(partitions[0].join('\n'));

		if (conf.combiner) {
			for (var i = 0; i < conf.nreducers; i++) {
				Combine(partitions[i], conf.combiner);
			}
		}

		print(assigns[0][i]);
		print('------------------');
		print(inter.join(' | '));
		print('------------------');

		print(partitions[0].join('\n'));
	}
}
*/

var MapTracker = {
	start: function (id, jobtracker, conf) {
		this.id = id;
		this.jobtracker = jobtracker;
		this.conf = conf;
		this.setTimer(0).done(this.fetchtask);
		this.name = 'Mapper ' + id;
		this.log('Mapper started');
	},

	fetchtask: function () {
		this.split = this.jobtracker.fetchmap(this.id);
		this.log('fetched map job');
		if (!this.split) return;

		 var records = this.split.split(this.conf.record_sep);
		 var nrecords = records.length;
		 this.intermediate = [];
		 for (var i = 0; i < nrecords; i++) {
			 var kv = records[i].split(this.conf.field_sep);
			 this.intermediate.push(this.conf.mapper(kv[0], kv[1]));
		 }

		var duration = this.conf.maptime * nrecords;
		this.setTimer(duration).done(this.mapdone);
	},

	mapdone: function () {
		var partitions = [];
		var npartitions = this.conf.nreducers;
		var inter = this.intermediate;
		var len = inter.length;
		var dict = {};
		var key, val, i, hash;

		for (i = 0; i < npartitions; i++) {
			partitions[i] = [];
		}

		for (i = 0; i < len; i++) {
			key = inter[i][0];
			val = inter[i][1];
			if (!dict[key]) {
				dict[key] = [val];
			} else {
				dict[key].push(val);
			}
		}

		for (key in dict) {
			hash = key.hashCode() % npartitions;
			partitions[hash].push([key, dict[key]]);
		}

		for (i = 0; i < npartitions; i++) {
			partitions[i].sort(function (a, b) {
				return a[0] < b[0] ? -1 : 1;
			});
		}

		this.partitions = partitions;

		this.setTimer(1).done(this.partition);
	},

	partition: function () {
		this.jobtracker.donemap(this.id, this.partitions);
	}

};


var ReduceTracker = {
	start: function (id, jobtracker, conf) {
		this.id = id;
		this.jobtracker = jobtracker;
		this.conf = conf;
		this.name = 'Reducer ' + id;
		this.data = [];
	},

	fetchdata: function (data) {
		data = data.data;
		this.log('I will fetch data');
		this.data = this.data.concat(data);
		this.data.sort(function (a, b) {
			return a[0] < b[0] ? -1 : 1;
		});
	},

	reduce: function () {
		this.log('I will reduce');	
		print('Output of reducer ' + this.id);
		var len = this.data.length;
		for (var i = 0; i < len; i++) {
			var kv = this.data[i];
			print(this.conf.reducer(kv[0], kv[1]));
		}
	}
};

var JobTracker = {
	start: function () {
		this.name = 'Master';
	},

	submit: function (data, conf) {
		this.conf = conf;
		var splits = split(data, conf.nsplits, conf.record_sep);
		var assigns = assignToMappers(splits, conf.nmappers);

		// Start the mapper tasktrackers
		this.maptasks = [];
		this.mapsremaining = conf.nmappers;
		for (var i = 0; i < conf.nmappers; i++) {
			this.maptasks.push({
				task: this.sim.addEntity(MapTracker, i, this, conf),
				at: 0,
				splits: assigns[i]});
		}

		// Start the reducer tasktrackers
		this.reducetasks = [];
		for (var i = 0; i < conf.nreducers; i++) {
			this.reducetasks.push({
				task: this.sim.addEntity(ReduceTracker, i, this, conf)
			});
		}
	},

	fetchmap: function (id) {
		var task = this.maptasks[id];
		if (task.at >= task.splits.length) return null;
		return task.splits[task.at];
	},

	donemap: function (id, partitions) {
		this.log('Mapping done by ' + id);
		var mapper = this.maptasks[id].task;
		var max = -1;
		
		// ask all reducers to fetch their data
		for (var i = this.reducetasks.length - 1; i >= 0; i--) {
			var reducer = this.reducetasks[i].task;
			var duration = partitions[i].length / conf.datarate;
			this.setTimer(duration).done(reducer.fetchdata, reducer, {data:partitions[i]});
			if (duration > max) max = duration;
		}
		
		this.setTimer(max).done(mapper.fetchtask, mapper);
		this.maptasks[id].at ++;
		if (this.maptasks[id].at >= this.maptasks[id].splits.length) {
			this.mapsremaining --;
		}

		if (this.mapsremaining === 0) {
			var ro = this.setTimer(max);
			for (var i = this.reducetasks.length - 1; i >= 0; i--) {
				var reducer = this.reducetasks[i].task;
				ro.done(reducer.reduce, reducer);
			}
		}
	}
};


var data = 'This section provides a reasonable amount of detail on every user-facing aspect of the Map/Reduce framwork. This should help users implement configure and tune their jobs in a fine-grained manner. However please note that the javadoc for each class/interface remains the most comprehensive documentation available; this is only meant to be a tutorial';

var conf = {
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

//MapReduce(data, conf);

var sim = new Sim();
sim.setLogger(print);
var job = sim.addEntity(JobTracker);
job.submit(data, conf);
sim.simulate(1000);

/*

Step 1: Splitting input into splits
Input: text, separater, nsplits
Output: split1, split2 ... splitn

Step 2: Assignment of splits to mappers
Input: [splits], nmappers
Output: [split1, ..] [split2..] .... [splitnmap..]

Step 3: Mapper function
Input: split, mapper, field-separator
Output: [k1:v1, k2:v2.....]

Step 4: sort and partition and combine
Input: [k1:v1, k2:v2 ...]
Step 4.1: partition
Input: [k1:v1, k2:v2 ...]
Output: [k1: v1, k2: v2]  [k3: v3]
Step 4.2: sort
Input: [k1: v1, k2: v2]  [k3: v3]
Output: [k1: [v1, v2], ]  [k3: [], ..]
Step 4.1-2 partition and sort
Input: [[k1, v1], [k2, v2].....]
Output: [k1: [v1, v2], k2: [ ]]   [         ]


Step 4.3: Combiner
Input: [k1: [v1, v2], ]  [k3: [], ..]
Ouput: [k1: v1, k2: v2] [k3: v3, ..]

Step 5: Copy data to reducers and merge
Input: [k1: ..] [k10: ...] (with or without combiner)
Output: [k1: [..], k2: [...]]

Step 6: Reduce
Input: [k1: [..], k2: [...]]
Output: [K1: V1, K2: V2]




JobClient
	- runJob
		polls the job progress once a second and report to console
		if job is successful, job counters are displayed
		otherwise error is logged
	- submitJob
		as the jobtracker for a new job id (calling JobTracker.newJobId)
		verify output directory
		compute teh input splits
		copy the resources (jar file, splits, confs) to JobTracker filesystem under jobid directory
		tell the jobtracker that job is ready (JobTracker.submitJob)


JobTracker
	- newJobId
	- submitJob
		puts in internal queue from hwere job scheduler will pick it up
		create one map task for each split
		create reduce tasks (based on mapred.reduce.tasks in JobConf)
		tasks are given id

TaskTracker
	periodically send heartbeat calls to jobtracker
	tell jobtracker that it is ready for new task
	receive task in response to heartbeat



*/
