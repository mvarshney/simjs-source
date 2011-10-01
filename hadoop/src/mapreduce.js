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

var MapTracker = {
	start: function (id, jobtracker, conf) {
		this.id = id;
		this.jobtracker = jobtracker;
		this.conf = conf;
		this.setTimer(0).done(this.fetchtask);
		this.name = 'Mapper ' + id;
	},

	fetchtask: function () {
		this.split = this.jobtracker.fetchmap(this.id);
		if (!this.split) return;

		 var records = this.split.split(this.conf.record_sep);
		 var nrecords = records.length;
		 var sep = this.conf.field_sep;
		 var mapper = this.conf.mapper;
		 this.intermediate = [];
		 for (var i = 0; i < nrecords; i++) {
			 var kv = records[i].split(sep);
			 var mapped = mapper(kv[0], kv[1]);
			 if (mapped) this.intermediate.push(mapped);
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

		var combiner = this.conf.combiner;
		for (i = 0; i < npartitions; i++) {
			if (combiner) {
				var len = partitions[i].length;
				for (var j = 0; j < len; j++) {
					var c = combiner(partitions[i][j][0], partitions[i][j][1]);
					partitions[i][j][0] = c[0];
					partitions[i][j][1] = [c[1]];
				}
			}
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
		var right  = data.data;
		var left = this.data;
		
		this.data = [];

		while((left.length > 0) && (right.length > 0))
		{
			if (left[0][0] === right[0][0]) {
				var a = left.shift();
				var b = right.shift();
				this.data.push([a[0], a[1].concat(b[1])]);
			} else if (left[0][0] < right[0][0]) {
				this.data.push(left.shift());
			} else {
			 	this.data.push(right.shift());
			}
		}
		while(left.length > 0)
			this.data.push(left.shift());
		while(right.length > 0)
			this.data.push(right.shift());
	},

	reduce: function () {
		print('Output of reducer ' + this.id);
		var len = this.data.length;
		var reducer = this.conf.reducer;
		if (!reducer) reducer = function (key, val) { return [key, val]; }
		for (var i = 0; i < len; i++) {
			var kv = this.data[i];
			print(reducer(kv[0], kv[1]));
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
		var mapper = this.maptasks[id].task;
		var max = -1;
		
		// ask all reducers to fetch their data
		for (var i = this.reducetasks.length - 1; i >= 0; i--) {
			var reducer = this.reducetasks[i].task;
			var duration = partitions[i].length / this.conf.datarate;
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
