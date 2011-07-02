/** Simulator Object
 * 
 */
function Sim() {
	this.simTime = 0;
	this.entities = [];
	this.queue = new Sim.PQueue();
	this.endTime = 0;
}

Sim.prototype.counter = (function () {
	var value = 1;
	return function () { return value ++; };
}());


Sim.prototype.time = function () {
	return this.simTime;
};

Sim.prototype.sendMessage = function () {
	var sender = this.source;
	var message = this.msg;
	var entities = this.data;
	var sim = sender.sim;
	
	if (!entities) {
		// send to all entities
		for (var i = sim.entities.length - 1; i >= 0; i--) {
			var entity = sim.entities[i];
			if (entity === sender) continue;
			if (entity.onMessage) entity.onMessage.call(entity, sender, message);
		}
	} else if (entities instanceof Array) {
		for (var i = entities.length - 1; i >= 0; i--) {
			var entity = entities[i];
			if (entity === sender) continue;
			if (entity.onMessage) entity.onMessage.call(entity, sender, message);
		}
	} else {
		if (entities.onMessage) {
			entities .onMessage.call(entities, sender, message);
		}
	}
};

Sim.prototype.addEntity = function (proto) {
	ARG_CHECK(arguments, 1, 1, Object);
	// Verify that prototype has start function
	if (!proto.start) {  // ARG CHECK
		throw new Error("Entity prototype must have start() function defined"); // ARG CHECK
	}  // ARG CHECK
	
	if (!proto.time) {
		proto.time = function () {
			return this.sim.time();
		};
		
		proto.setTimer = function (duration) {
			ARG_CHECK(arguments, 1, 1);
			
			var ro = new Sim.Request(
					this, 
					this.sim.time(), 
					this.sim.time() + duration);
			
			this.sim.queue.insert(ro);
			return ro;
		};
		
		proto.waitEvent = function (event) {
			ARG_CHECK(arguments, 1, 1, Sim.Event);
			
			var ro = new Sim.Request(this, this.sim.time(), 0);
			
			ro.source = event;
			event.addWaitList(ro);
			return ro;
		};
		
		proto.queueEvent = function (event) {
			ARG_CHECK(arguments, 1, 1, Sim.Event);
			
			var ro = new Sim.Request(this, this.sim.time(), 0);
			
			ro.source = event;
			event.addQueue(ro);
			return ro;
		};
		
		proto.useFacility = function (facility, duration) {
			ARG_CHECK(arguments, 2, 2, Sim.Facility);
			
			var ro = new Sim.Request(this, this.sim.time(), 0);
			ro.source = facility;
			facility.use(duration, ro);
			return ro;
		};
		
		proto.putBuffer = function (buffer, amount) {
			ARG_CHECK(arguments, 2, 2, Sim.Buffer);
			
			var ro = new Sim.Request(this, this.sim.time(), 0);
			ro.source = buffer;
			buffer.put(amount, ro);
			return ro;
		};
		
		proto.getBuffer = function (buffer, amount) {
			ARG_CHECK(arguments, 2, 2, Sim.Buffer);
			
			var ro = new Sim.Request(this, this.sim.time(), 0);
			ro.source = buffer;
			buffer.get(amount, ro);
			return ro;
		};
		
		proto.send = function (message, delay, entities) {
			ARG_CHECK(arguments, 2, 3);
			
			var ro = new Sim.Request(this.sim, this.time(), this.time() + delay);
			ro.source = this;
			ro.msg = message;
			ro.data = entities;
			ro.deliver = this.sim.sendMessage;
			
			this.sim.queue.insert(ro);
		};
		
		proto.log = function (message) {
			ARG_CHECK(arguments, 1, 1);
			
			this.sim.log(message);
		};
	}
	
	var obj = (function (p) {
		if (p == null) throw TypeError(); 
		if (Object.create)
			return Object.create(p); 
		var t = typeof p; 
		if (t !== "object" && t !== "function") throw TypeError();

		function f() {}; 
		f.prototype = p; 
		return new f();
	}(proto));
	
	obj.sim = this;
	obj.id = this.counter();
	
	this.entities.push(obj);
	
	return obj;
};


Sim.prototype.simulate = function (endTime, flags) {
	ARG_CHECK(arguments, 1, 1);
	
	this.endTime = endTime;
	for (var i = 0; i < this.entities.length; i++) {
		this.entities[i].start();
	}
	
	this.runLoop();
};

Sim.prototype.runLoop = function () {
	while (true) {
		// Get the earliest event
		var ro = this.queue.remove();
		
		// If there are no more events, we are done with simulation here.
		if (ro == undefined) break;

		// Uh oh.. we are out of time now
		if (ro.deliverAt > this.endTime) break;
		
		// Advance simulation time
		this.simTime =  ro.deliverAt;
		
		// If this event is already cancelled, ignore
		if (ro.cancelled) continue;

		ro.deliver();
	}
	
	this.finalize();
};

Sim.prototype.finalize = function () {
	for(var i = 0; i < this.entities.length; i++) {
		if (this.entities[i].finalize) {
			this.entities[i].finalize();
		}
	}
};

Sim.prototype.setLogger = function (logger) {
	ARG_CHECK(arguments, 1, 1, Function);
	this.logger = logger;
};

Sim.prototype.log = function (message, entity) {
	ARG_CHECK(arguments, 1, 2);
	
	if (!this.logger) return;
	var entityMsg = "";
	if (entity !== undefined) entityMsg = " [" + entity.id + "] ";
	this.logger(this.simTime.toFixed(6)
			+ entityMsg
			+ "   " 
			+ message 
			+ "\n");
};

/** Facility
 *
 * Scheduling disciplines: 
 * 	- FCFS
 *  - Infinite servers // subcase of FCFS: servers = Infinity. IMM
 *  - Last come, first served, preempt: IMM
 *  - Processor sharing: IMM
 *  - Round robin, with time slice: NOT IMM
 *  
 *  Priority Based:
 *   - Preempt, resume: NOT IMM
 *   - Preempt, restart: NOT IMM
 *   - Round robin with priority: NOT IMM
 */

Sim.Facility = function (name, discipline, servers) {
	ARG_CHECK(arguments, 1, 3);
	
	this.free = servers ? servers : 1;
	this.servers = servers ? servers : 1;
	switch (discipline) {

	case Sim.Facility.LCFS:
		this.use = this.useLCFS;
		break;
	case Sim.Facility.FCFS:
	default:
		this.use = this.useFCFS;
		this.freeServers = new Array(this.servers);
		for (var i = 0; i < this.freeServers.length; i++) {
			this.freeServers[i] = true;
		}
	}
	this.queue = new Sim.Queue();
	this.stats = new Sim.Population();
	this.busyDuration = 0;
};

Sim.Facility.FCFS = 1;
Sim.Facility.LCFS = 2;
Sim.Facility.NumDisciplines = 3;

Sim.Facility.prototype.reset = function () {
	this.queue.reset();
	this.stats.reset();
	this.busyDuration = 0;
};

Sim.Facility.prototype.systemStats = function () {
	return this.stats;
};

Sim.Facility.prototype.queueStats = function () {
	return this.queue.stats;
};

Sim.Facility.prototype.usage = function () {
	return this.busyDuration;
};

Sim.Facility.prototype.finalize = function (timestamp) {
	ARG_CHECK(arguments, 1, 1);
	
	this.stats.finalize(timestamp);
	this.queue.stats.finalize(timestamp);
};

Sim.Facility.prototype.useFCFSSchedule = function (timestamp) {
	ARG_CHECK(arguments, 1, 1);
	
	while (this.free > 0 && !this.queue.empty()) {
		var ro = this.queue.shift(timestamp); // TODO
		if (ro.cancelled) {
			continue;
		}
		for (var i = 0; i < this.freeServers.length; i++) {
			if (this.freeServers[i]) {
				this.freeServers[i] = false;
				ro.msg = i;
				break;
			};
		}

		this.free --;
		this.busyDuration += ro.duration;

		ro.saved_deliver = ro.deliver;
		ro.deliver = this.useFCFSCallback;
		
		// cancel all other reneging requests
		ro.cancelRenegeClauses();

		ro.deliverAt = ro.entity.time() + ro.duration;
		ro.entity.sim.queue.insert(ro);
	}
};

Sim.Facility.prototype.useFCFS = function (duration, ro) {
	ARG_CHECK(arguments, 2, 2);
	
	ro.duration = duration;
	this.stats.enter(ro.entity.time());
	this.queue.push(ro, ro.entity.time());
	this.useFCFSSchedule(ro.entity.time());
};

Sim.Facility.prototype.useFCFSCallback = function () {
	var ro = this;
	var facility = ro.source;
	// We have one more free server
	facility.free ++;
	facility.freeServers[ro.msg] = true;

	facility.stats.leave(ro.scheduledAt, ro.deliverAt);
	
	// restore the deliver function, and deliver
	ro.deliver = ro.saved_deliver;
	delete ro.saved_deliver;
	ro.deliver();
	
	// if there is someone waiting, schedule it now
	facility.useFCFSSchedule(ro.entity.time());
};

Sim.Facility.prototype.useLCFS = function (duration, ro) {
	ARG_CHECK(arguments, 2, 2);
	
	// if there was a running request..
	if (this.currentRO) {
		this.busyDuration += (this.currentRO.entity.time() - this.currentRO.lastIssued);
		// calcuate the remaining time
		this.currentRO.remaining = 
			(this.currentRO.deliverAt - this.currentRO.entity.time());
		// preempt it..
		this.queue.push(this.currentRO, ro.entity.time());
	}

	this.currentRO = ro;
	// If this is the first time..
	if (!ro.saved_deliver) {
		ro.cancelRenegeClauses();
		ro.remaining = duration;
		ro.saved_deliver = ro.deliver;
		ro.deliver = this.useLCFSCallback;
		
		this.stats.enter(ro.entity.time());
	}
	
	ro.lastIssued = ro.entity.time();
	
	// schedule this new event
	ro.deliverAt = ro.entity.time() + duration;
	ro.entity.sim.queue.insert(ro);
};

Sim.Facility.prototype.useLCFSCallback = function () {
	var ro = this;
	var facility = ro.source;
	
	if (ro != facility.currentRO) return;
	facility.currentRO = null;
	
	// stats
	facility.busyDuration += (ro.entity.time() - ro.lastIssued);
	facility.stats.leave(ro.scheduledAt, ro.entity.time());
	
	// deliver this request
	ro.deliver = ro.saved_deliver;
	delete ro.saved_deliver;
	ro.deliver();
	
	// see if there are pending requests
	if (!facility.queue.empty()) {
		var obj = facility.queue.pop(ro.entity.time());
		facility.useLCFS(obj.remaining, obj);
	}
};

/** Buffer
 * 
 */
Sim.Buffer = function (name, capacity, initial) {
	ARG_CHECK(arguments, 2, 3);
	
	this.name = name;
	this.capacity = capacity;
	this.available = (initial === undefined) ? 0 : initial;
	this.putQueue = new Sim.Queue();
	this.getQueue = new Sim.Queue();
};

Sim.Buffer.prototype.current = function () {
	return this.available;
};

Sim.Buffer.prototype.size = function () {
	return this.capacity;
};

Sim.Buffer.prototype.get = function (amount, ro) {
	ARG_CHECK(arguments, 2, 2);
	
	if (this.getQueue.empty()
			&& amount <= this.available) {
		this.available -= amount;
		
		ro.deliverAt = ro.entity.time();
		ro.entity.sim.queue.insert(ro);
		
		this.getQueue.passby(ro.deliverAt);
		
		this.progressPutQueue();
		
		return;
	}
	ro.amount = amount;
	this.getQueue.push(ro, ro.entity.time());
};

Sim.Buffer.prototype.put = function (amount, ro) {
	ARG_CHECK(arguments, 2, 2);
	
	if (this.putQueue.empty()
			&& (amount + this.available) <= this.capacity) {
		this.available += amount;
		
		ro.deliverAt = ro.entity.time();
		ro.entity.sim.queue.insert(ro);
		
		this.putQueue.passby(ro.deliverAt);
		
		this.progressGetQueue();
		
		return;
	}
	
	ro.amount = amount;
	this.putQueue.push(ro, ro.entity.time());
};

Sim.Buffer.prototype.progressGetQueue = function () {
	var obj;
	while (obj = this.getQueue.top()) {
		// if obj is cancelled.. remove it.
		if (obj.cancelled) {
			this.getQueue.shift(obj.entity.time());
			continue;
		} 
		
		// see if this request can be satisfied
		if (obj.amount <= this.available) {
			// remove it..
			this.getQueue.shift(obj.entity.time());
			this.available -= obj.amount;
			obj.deliverAt = obj.entity.time();
			obj.entity.sim.queue.insert(obj);
		} else {
			// this request cannot be satisfied
			break;
		}
	}
};

Sim.Buffer.prototype.progressPutQueue = function () {
	var obj;
	while (obj = this.putQueue.top()) {
		// if obj is cancelled.. remove it.
		if (obj.cancelled) {
			this.putQueue.shift(obj.entity.time());
			continue;
		} 
		
		// see if this request can be satisfied
		if (obj.amount + this.available <= this.capacity) {
			// remove it..
			this.putQueue.shift(obj.entity.time());
			this.available += obj.amount;
			obj.deliverAt = obj.entity.time();
			obj.entity.sim.queue.insert(obj);
		} else {
			// this request cannot be satisfied
			break;
		}
	}
};

Sim.Buffer.prototype.putStats = function () {
	return this.putQueue.stats;
};

Sim.Buffer.prototype.getStats = function () {
	return this.getQueue.stats;
};

/** Event
 * 
 */
Sim.Event = function (name) {
	ARG_CHECK(arguments, 0, 1);
	
	this.name = name;
	this.waitList = [];
	this.queue = [];
	this.isFired = false;
};

Sim.Event.prototype.addWaitList = function(ro) {
	ARG_CHECK(arguments, 1, 1);
	
	if (this.isFired) {
		ro.deliverAt = ro.entity.time();
		ro.entity.sim.queue.insert(ro);
		return;
	}
	this.waitList.push(ro);
};

Sim.Event.prototype.addQueue = function(ro) {
	ARG_CHECK(arguments, 1, 1);
	
	if (this.isFired) {
		ro.deliverAt = ro.entity.time();
		ro.entity.sim.queue.insert(ro);
		return;
	}
	this.queue.push(ro);
};

Sim.Event.prototype.fire = function(keepFired) {
	ARG_CHECK(arguments, 0, 1);
	
	if (keepFired) {
		this.isFired = true;
	}
	
	// Dispatch all waiting entities
	for (var i = 0; i < this.waitList.length; i ++) {
		this.waitList[i].deliver();
	}
	this.waitList = [];
	
	// Dispatch one queued entity
	var lucky = this.queue.shift();
	if (lucky) {
		lucky.deliver();
	}
};

Sim.Event.prototype.clear = function() {
	this.isFired = false;
};


function ARG_CHECK(found, expMin, expMax) {
	if (found.length < expMin || found.length > expMax) {   // ARG_CHECK
		throw new Error("Incorrect number of arguments");   // ARG_CHECK
	}   // ARG_CHECK
	
	
	for (var i = 0; i < found.length; i++) {   // ARG_CHECK
		if (!arguments[i + 3] || !found[i]) continue;   // ARG_CHECK
		
//		print("TEST " + found[i] + " " + arguments[i + 3]   // ARG_CHECK
//		+ " " + (found[i] instanceof Sim.Event)   // ARG_CHECK
//		+ " " + (found[i] instanceof arguments[i + 3])   // ARG_CHECK
//		+ "\n");   // ARG CHECK
		
		
		if (! (found[i] instanceof arguments[i + 3])) {   // ARG_CHECK
			throw new Error("parameter " + (i + 1) + " is of incorrect type.");   // ARG_CHECK
		}   // ARG_CHECK
	}   // ARG_CHECK
}   // ARG_CHECK

/** Request
 * 
 */

// Public API
Sim.Request = function (entity, currentTime, deliverAt) {
	this.entity = entity;
	this.scheduledAt = currentTime;
	this.deliverAt = deliverAt;
	this.callbacks = [];
	this.cancelled = false;
	this.group = null;
};

Sim.Request.prototype.cancel = function () {
	// Ask the main request to handle cancellation
	if (this.group && this.group[0] != this) {
		return this.group[0].cancel();
	}
	
	// --> this is main request
	
	// if already cancelled, do nothing
	if (this.cancelled) return;
	
	// set flag
	this.cancelled = true;
	
	if (this.deliverAt == 0) {
		this.deliverAt = this.entity.time(); 
	}

	if (this.source) {
		if (this.source instanceof Sim.Buffer) {
			this.source.progressPutQueue.call(this.source);
			this.source.progressGetQueue.call(this.source);
		}
	}
	
	if (!this.group) {
		return;
	}
	for (var i = 1; i < this.group.length; i++) {
		this.group[i].cancelled = true;
		if (this.group[i].deliverAt == 0) {
			this.group[i].deliverAt = this.entity.time(); 
		}
	}
};

Sim.Request.prototype.done = function (callback, context, argument) {
	ARG_CHECK(arguments, 0, 3, Function, Object);
	
	this.callbacks.push([callback, context, argument]);
	return this;
};

Sim.Request.prototype.waitUntil = function (delay, callback, context, argument) {
	ARG_CHECK(arguments, 1, 4, undefined, Function, Object);
	
	var ro = this._addRequest(this.scheduledAt + delay, callback, context, argument);
	this.entity.sim.queue.insert(ro);
	return this;
};


Sim.Request.prototype.unlessEvent = function (event, callback, context, argument) {
	ARG_CHECK(arguments, 1, 4, undefined, Function, Object);
	
	if (event instanceof Sim.Event) {
		var ro = this._addRequest(0, callback, context, argument);
		ro.msg = event;
		event.addWaitList(ro);
		
	} else if (event instanceof Array) {
		for (var i = 0; i < event.length; i ++) {
			var ro = this._addRequest(0, callback, context, argument);
			ro.msg = event[i];
			event[i].addWaitList(ro);
		}
	}
	
	return this;
};

Sim.Request.prototype.setData = function (data) {
	this.data = data;	
	return this;
};

// Non Public API
Sim.Request.prototype.deliver = function () {
	if (this.cancelled) return;
	this.cancel();
	if (!this.callbacks) return;

	if (this.group && this.group.length > 0) {
		this._doCallback(this.group[0].source, 
				this.msg,
				this.group[0].data);
	} else {
		this._doCallback(this.source,
				this.msg,
				this.data);
	}
	
};

Sim.Request.prototype.cancelRenegeClauses = function () {
	this.cancel = this.Null;
	this.waitUntil = this.Null;
	this.unlessEvent = this.Null;
	
	if (!this.group || this.group[0] != this) {
		return;
	}
	
	for (var i = 1; i < this.group.length; i++) {
		this.group[i].cancelled = true;
		if (this.group[i].deliverAt == 0) {
			this.group[i].deliverAt = this.entity.time();
		}
	}
};

Sim.Request.prototype.Null = function () {
	return this;
};

// Private API
Sim.Request.prototype._addRequest = function (deliverAt, callback, context, argument) {
	var ro = new Sim.Request(
			this.entity, 
			this.scheduledAt,
			deliverAt);
	
	ro.callbacks.push([callback, context, argument]);

	if (this.group === null) {
		this.group = [this];
	}

	this.group.push(ro);
	ro.group = this.group;
	return ro;
};

Sim.Request.prototype._doCallback = function (source, msg, data) {
	for (var i = 0; i < this.callbacks.length; i++) {
		var callback = this.callbacks[i][0];
		if (!callback) continue;
		
		var context = this.callbacks[i][1];
		if (!context) context = this.entity;
		
		var argument = this.callbacks[i][2];
		
		context.callbackSource = source;
		context.callbackMessage = msg;
		context.callbackData = data;
		
		if (!argument) {
			callback.call(context);
		} else if (argument instanceof Array) {
			callback.apply(context, argument);
		} else {
			callback.call(context, argument);
		}
		
		delete context.callbackSource;
		delete context.callbackMessage;
		delete context.callbackData;
	}
};/** Queues
 * 
 * This module provides:
 * - First in first out queue
 * - Last in first out queue
 * - Priority Queue
 */

Sim.Queue = function (name) {
	this.name = name;
	this.data = [];
	this.timestamp = [];
	this.stats = new Sim.Population();
};

Sim.Queue.prototype.top = function () {
	return this.data[0];
};

Sim.Queue.prototype.back = function () {
	return (this.data.length) ? this.data[this.data.length - 1] : undefined;
};

Sim.Queue.prototype.push = function (value, timestamp) {
	ARG_CHECK(arguments, 2, 2);
	this.data.push(value);
	this.timestamp.push(timestamp);
	
	this.stats.enter(timestamp);
};

Sim.Queue.prototype.unshift = function (value, timestamp) {
	ARG_CHECK(arguments, 2, 2);
	this.data.unshift(value);
	this.timestamp.unshift(timestamp);
	
	this.stats.enter(timestamp);
};

Sim.Queue.prototype.shift = function (timestamp) {
	ARG_CHECK(arguments, 1, 1);
	
	var value = this.data.shift();
	var enqueuedAt = this.timestamp.shift();

	this.stats.leave(enqueuedAt, timestamp);
	return value;
};

Sim.Queue.prototype.pop = function (timestamp) {
	ARG_CHECK(arguments, 1, 1);
	
	var value = this.data.pop();
	var enqueuedAt = this.timestamp.pop();

	this.stats.leave(enqueuedAt, timestamp);
	return value;
};

Sim.Queue.prototype.passby = function (timestamp) {
	ARG_CHECK(arguments, 1, 1);
	
	this.stats.enter(timestamp);
	this.stats.leave(timestamp, timestamp);
};

Sim.Queue.prototype.finalize = function (timestamp) {
	ARG_CHECK(arguments, 1, 1);
	
	this.stats.finalize(timestamp);
};

Sim.Queue.prototype.reset = function () {
	this.stats.reset();
};

Sim.Queue.prototype.clear = function () {
	this.reset();
	this.data = [];
	this.timestamp = [];
};

Sim.Queue.prototype.report = function () {
	return [this.stats.sizeSeries.average(),
	        this.stats.durationSeries.average()];
};

Sim.Queue.prototype.empty = function () {
	return this.data.length == 0;
};

Sim.Queue.prototype.size = function () {
	return this.data.length;
};

/** Priority Queue. Uses binary heap.
 *
 * This is not a general purpose priority queue. It is custom made for
 * Request object. Request.deliverAt is the key.
 */

Sim.PQueue = function () {
	this.data = [];
};

/* Root at index 0
 * Parent (i) = Math.floor((i-1) / 2)
 * Left (i) = 2i + 1
 * Right (i) = 2i + 2
 */

Sim.PQueue.prototype.insert = function (ro) {
	ARG_CHECK(arguments, 1, 1);
	
	var index = this.data.length;
	this.data.push(ro);

	// insert into data at the end
	var a = this.data;
	var node = a[index];

	// heap up
	while (index > 0) {
		var parentIndex = Math.floor((index - 1) / 2);
		if (a[parentIndex].deliverAt > ro.deliverAt) {
			a[index] = a[parentIndex];
			index = parentIndex;
		} else {
			break;
		}
	}
	a[index] = node;
};

Sim.PQueue.prototype.remove = function () {
	var a = this.data;
	var len = a.length;
	if (len <= 0) {
		return undefined;
	}
	if (len == 1) {
		return this.data.pop();
	}
	var top = a[0];
	// move the last node up
	a[0] = a.pop();
	len --;
	
	// heap down
	var index = 0;
	var node = a[index];

	while (index < Math.floor(len / 2)) {
		var leftChildIndex = 2 * index + 1;
		var rightChildIndex = 2 * index + 2;

		var smallerChildIndex = rightChildIndex < len 
		&& a[rightChildIndex].deliverAt < a[leftChildIndex].deliverAt 
				? rightChildIndex : leftChildIndex;

		if (a[smallerChildIndex].deliverAt > node.deliverAt) {
			break;
		}

		a[index] = a[smallerChildIndex];
		index = smallerChildIndex;
	}
	a[index] = node;
	
	return top;
};










/** Statistics
 * 
 */

/** DataSeries
 * 
 * Mean and variance algorithm from Wikipedia
 * http://en.wikipedia.org/wiki/Standard_deviation#Rapid_calculation_methods
 */

Sim.DataSeries = function (name) {
	this.name = name;
	this.reset();
};

Sim.DataSeries.prototype.reset = function () {
	this.Count = 0;
	this.W = 0.0;
	this.A = 0.0;
	this.Q = 0.0;
	this.Max = -Infinity;
	this.Min = Infinity;
	this.Sum = 0;
	
	if (this.histogram) {
		for (var i = 0; i < this.histogram.length; i++) {
			this.histogram[i] = 0;
		}
	}
};

Sim.DataSeries.prototype.setHistogram = function (lower, upper, nbuckets) {
	ARG_CHECK(arguments, 3, 3);
	
	this.hLower = lower;
	this.hUpper = upper;
	this.hBucketSize = (upper - lower) / nbuckets;
	this.histogram = new Array(nbuckets + 2);
	for (var i = 0; i < this.histogram.length; i++) {
		this.histogram[i] = 0;
	}
};

Sim.DataSeries.prototype.getHistogram = function () {
	return this.histogram;
};

Sim.DataSeries.prototype.record = function (value, weight) {
	ARG_CHECK(arguments, 1, 2);
	
	var w = (weight === undefined) ? 1 : weight;
	//document.write("Data series recording " + value + " (weight = " + w + ")\n");

	if (value > this.Max) this.Max = value;
	if (value < this.Min) this.Min = value;
	this.Sum += value;
	this.Count ++;
	if (this.histogram) {
		if (value < this.hLower) { 
			this.histogram[0] ++; 
		}
		else if (value > this.hUpper) { 
			this.histogram[this.histogram.length - 1] ++;
		} else {
			var index = Math.floor((value - this.hLower) / this.hBucketSize) + 1;
			this.histogram[index] ++;
		}
	}
	
	// Wi = Wi-1 + wi
	this.W = this.W + w;  
	
	if (this.W === 0) {
		return;
	}
	
	// Ai = Ai-1 + wi/Wi * (xi - Ai-1)
	var lastA = this.A;
	this.A = lastA + (w / this.W) * (value - lastA);
	
	// Qi = Qi-1 + wi(xi - Ai-1)(xi - Ai)
	this.Q = this.Q + w * (value - lastA) * (value - this.A);
	//print("\tW=" + this.W + " A=" + this.A + " Q=" + this.Q + "\n");
};

Sim.DataSeries.prototype.count = function () {
	return this.Count;
};

Sim.DataSeries.prototype.min = function () {
	return this.Min;
};

Sim.DataSeries.prototype.max = function () {
	return this.Max;
};

Sim.DataSeries.prototype.range = function () {
	return this.Max - this.Min;
};

Sim.DataSeries.prototype.sum = function () {
	return this.Sum;
};

Sim.DataSeries.prototype.sumWeighted = function () {
	return this.A * this.W;
};

Sim.DataSeries.prototype.average = function () {
	return this.A;
};

Sim.DataSeries.prototype.variance = function () {
	return this.Q / this.W;
};

Sim.DataSeries.prototype.deviation = function () {
	return Math.sqrt(this.variance());
};


/** Time series
 * 
 */
Sim.TimeSeries = function (name) {
	this.dataSeries = new Sim.DataSeries(name);
};

Sim.TimeSeries.prototype.reset = function () {
	this.dataSeries.reset();
	this.lastValue = NaN;
	this.lastTimestamp = NaN;
};

Sim.TimeSeries.prototype.setHistogram = function (lower, upper, nbuckets) {
	ARG_CHECK(arguments, 3, 3);
	this.dataSeries.setHistogram(lower, upper, nbucket);
};

Sim.TimeSeries.prototype.getHistogram = function () {
	return this.dataSeries.getHistogram();
};

Sim.TimeSeries.prototype.record = function (value, timestamp) {
	ARG_CHECK(arguments, 2, 2);
	
	if (!isNaN(this.lastTimestamp)) {
		this.dataSeries.record(this.lastValue, timestamp - this.lastTimestamp);
	}
	
	this.lastValue = value;
	this.lastTimestamp = timestamp;
};

Sim.TimeSeries.prototype.finalize = function (timestamp) {
	ARG_CHECK(arguments, 1, 1);
	
	this.record(NaN, timestamp);
};

Sim.TimeSeries.prototype.count = function () {
	return this.dataSeries.count();
};

Sim.TimeSeries.prototype.min = function () {
	return this.dataSeries.min();
};

Sim.TimeSeries.prototype.max = function () {
	return this.dataSeries.max();
};

Sim.TimeSeries.prototype.range = function () {
	return this.dataSeries.range();
};

Sim.TimeSeries.prototype.sum = function () {
	return this.dataSeries.sum();
};

Sim.TimeSeries.prototype.average = function () {
	return this.dataSeries.average();
};

Sim.TimeSeries.prototype.deviation = function () {
	return this.dataSeries.deviation();
};

Sim.TimeSeries.prototype.variance = function () {
	return this.dataSeries.variance();
};

/** Population 
 * 
 */

Sim.Population = function (name) {
	this.name = name;
	this.population = 0;
	this.sizeSeries = new Sim.TimeSeries();
	this.durationSeries = new Sim.DataSeries();
};

Sim.Population.prototype.reset = function () {
	this.sizeSeries.reset();
	this.durationSeries.reset();
	this.population = 0;
};

Sim.Population.prototype.enter = function (timestamp) {
	ARG_CHECK(arguments, 1, 1);
	
	this.population ++;
	this.sizeSeries.record(this.population, timestamp);
};

Sim.Population.prototype.leave = function (arrivalAt, leftAt) {
	ARG_CHECK(arguments, 2, 2);
	
	this.population --;
	this.sizeSeries.record(this.population, leftAt);
	this.durationSeries.record(leftAt - arrivalAt);
};

Sim.Population.prototype.current = function () {
	return this.population;
};

Sim.Population.prototype.finalize = function (timestamp) {
	this.sizeSeries.finalize(timestamp);
};



/*
  I've wrapped Makoto Matsumoto and Takuji Nishimura's code in a namespace
  so it's better encapsulated. Now you can have multiple random number generators
  and they won't stomp all over eachother's state.

  - Sean McCullough (banksean@gmail.com)
*/

/* 
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.
 
   Before using, initialize the state by using init_genrand(seed)  
   or init_by_array(init_key, key_length).
 
   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.                          
 
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:

     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.

     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.

     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
 */

var Random = function(seed) {
	seed = (seed === undefined) ? (new Date()).getTime() : seed;
	if (typeof(seed) !== 'number'                             // ARG_CHECK
		|| Math.ceil(seed) != Math.floor(seed)) {             // ARG_CHECK
		throw new TypeError("seed value must be an integer"); // ARG_CHECK
	}                                                         // ARG_CHECK
	
	
	/* Period parameters */  
	this.N = 624;
	this.M = 397;
	this.MATRIX_A = 0x9908b0df;   /* constant vector a */
	this.UPPER_MASK = 0x80000000; /* most significant w-r bits */
	this.LOWER_MASK = 0x7fffffff; /* least significant r bits */

	this.mt = new Array(this.N); /* the array for the state vector */
	this.mti=this.N+1; /* mti==N+1 means mt[N] is not initialized */

	//this.init_genrand(seed);
	this.init_by_array([seed], 1);
};

/* initializes mt[N] with a seed */
Random.prototype.init_genrand = function(s) {
	this.mt[0] = s >>> 0;
	for (this.mti=1; this.mti<this.N; this.mti++) {
		var s = this.mt[this.mti-1] ^ (this.mt[this.mti-1] >>> 30);
		this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253)
		+ this.mti;
		/* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
		/* In the previous versions, MSBs of the seed affect   */
		/* only MSBs of the array mt[].                        */
		/* 2002/01/09 modified by Makoto Matsumoto             */
		this.mt[this.mti] >>>= 0;
		/* for >32 bit machines */
	}
};

/* initialize by an array with array-length */
/* init_key is the array for initializing keys */
/* key_length is its length */
/* slight change for C++, 2004/2/26 */
Random.prototype.init_by_array = function(init_key, key_length) {
	var i, j, k;
	this.init_genrand(19650218);
	i=1; j=0;
	k = (this.N>key_length ? this.N : key_length);
	for (; k; k--) {
		var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30);
		this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525)))
		+ init_key[j] + j; /* non linear */
		this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
		i++; j++;
		if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
		if (j>=key_length) j=0;
	}
	for (k=this.N-1; k; k--) {
		var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30);
		this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941))
		- i; /* non linear */
		this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
		i++;
		if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
	}

	this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */ 
};
 
/* generates a random number on [0,0xffffffff]-interval */
Random.prototype.genrand_int32 = function() {
	var y;
	var mag01 = new Array(0x0, this.MATRIX_A);
	/* mag01[x] = x * MATRIX_A  for x=0,1 */

	if (this.mti >= this.N) { /* generate N words at one time */
		var kk;

		if (this.mti == this.N+1)   /* if init_genrand() has not been called, */
			this.init_genrand(5489); /* a default initial seed is used */

		for (kk=0;kk<this.N-this.M;kk++) {
			y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
			this.mt[kk] = this.mt[kk+this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
		}
		for (;kk<this.N-1;kk++) {
			y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
			this.mt[kk] = this.mt[kk+(this.M-this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
		}
		y = (this.mt[this.N-1]&this.UPPER_MASK)|(this.mt[0]&this.LOWER_MASK);
		this.mt[this.N-1] = this.mt[this.M-1] ^ (y >>> 1) ^ mag01[y & 0x1];

		this.mti = 0;
	}

	y = this.mt[this.mti++];

	/* Tempering */
	y ^= (y >>> 11);
	y ^= (y << 7) & 0x9d2c5680;
	y ^= (y << 15) & 0xefc60000;
	y ^= (y >>> 18);

	return y >>> 0;
};
 
/* generates a random number on [0,0x7fffffff]-interval */
Random.prototype.genrand_int31 = function() {
	return (this.genrand_int32()>>>1);
};

/* generates a random number on [0,1]-real-interval */
Random.prototype.genrand_real1 = function() {
	return this.genrand_int32()*(1.0/4294967295.0); 
	/* divided by 2^32-1 */ 
};

/* generates a random number on [0,1)-real-interval */
Random.prototype.random = function() {
	if (this.pythonCompatibility) {
		if (this.skip) {
			this.genrand_int32();
		}
		this.skip = true;
	}
	return this.genrand_int32()*(1.0/4294967296.0); 
	/* divided by 2^32 */
};

/* generates a random number on (0,1)-real-interval */
Random.prototype.genrand_real3 = function() {
	return (this.genrand_int32() + 0.5)*(1.0/4294967296.0); 
	/* divided by 2^32 */
};

/* generates a random number on [0,1) with 53-bit resolution*/
Random.prototype.genrand_res53 = function() { 
	var a=this.genrand_int32()>>>5, b=this.genrand_int32()>>>6; 
	return(a*67108864.0+b)*(1.0/9007199254740992.0); 
};

/* These real versions are due to Isaku Wada, 2002/01/09 added */


/**************************************************************************/
Random.prototype.LOG4 = Math.log(4.0);
Random.prototype.SG_MAGICCONST = 1.0 + Math.log(4.5);

Random.prototype.exponential = function (lambda) {
	if (arguments.length != 1) {                         // ARG_CHECK                     
		throw new SyntaxError("exponential() must "     // ARG_CHECK
				+ " be called with 'lambda' parameter"); // ARG_CHECK
	}                                                   // ARG_CHECK
	
	var r = this.random();
	return -Math.log(r) / lambda;
};

Random.prototype.gamma = function (alpha, beta) {
	if (arguments.length != 2) {                         // ARG_CHECK                     
		throw new SyntaxError("gamma() must be called"  // ARG_CHECK
				+ " with alpha and beta parameters"); // ARG_CHECK
	}                                                   // ARG_CHECK
	
	/* Based on Python 2.6 source code of random.py.
	 */
	
	if (alpha > 1.0) {
		var ainv = Math.sqrt(2.0 * alpha - 1.0);
		var bbb = alpha - this.LOG4;
		var ccc = alpha + ainv;
		
		while (true) {
			var u1 = this.random();
			if ((u1 < 1e-7) || (u > 0.9999999)) {
				continue;
			}
			var u2 = 1.0 - this.random();
			var v = Math.log(u1 / (1.0 - u1)) / ainv;
			var x = alpha * Math.exp(v);
			var z = u1 * u1 * u2;
			var r = bbb + ccc * v - x;
			if ((r + this.SG_MAGICCONST - 4.5 * z >= 0.0) || (r >= Math.log(z))) {
				return x * beta;
			}
		}
	} else if (alpha == 1.0) {
		var u = this.random();
		while (u <= 1e-7) {
			u = this.random();
		}
		return - Math.log(u) * beta;
	} else {
		while (true) {
			var u = this.random();
			var b = (Math.E + alpha) / Math.E;
			var p = b * u;
			if (p <= 1.0) {
				var x = Math.pow(p, 1.0 / alpha);
			} else {
				var x = - Math.log((b - p) / alpha);
			}
			var u1 = this.random();
			if (p > 1.0) {
				if (u1 <= Math.pow(x, (alpha - 1.0))) {
					break;
				}
			} else if (u1 <= Math.exp(-x)) {
				break;
			}
		}
		return x * beta;
	}
	
};

Random.prototype.normal = function (mu, sigma) {
	if (arguments.length != 2) {                          // ARG_CHECK                     
		throw new SyntaxError("normal() must be called"  // ARG_CHECK
				+ " with mu and sigma parameters");      // ARG_CHECK
	}                                                    // ARG_CHECK
	
	var z = this.lastNormal;
	this.lastNormal = NaN;
	if (!z) {
		var a = this.random() * 2 * Math.PI;
		var b = Math.sqrt(-2.0 * Math.log(1.0 - this.random()));
		z = Math.cos(a) * b;
		this.lastNormal = Math.sin(a) * b;
	} 
	return mu + z * sigma;
};

Random.prototype.pareto = function (alpha) {
	if (arguments.length != 1) {                         // ARG_CHECK                     
		throw new SyntaxError("pareto() must be called" // ARG_CHECK
				+ " with alpha parameter");             // ARG_CHECK
	}                                                   // ARG_CHECK
	
	var u = this.random();
	return 1.0 / Math.pow((1 - u), 1.0 / alpha);
};

Random.prototype.triangular = function (lower, upper, mode) {
	// http://en.wikipedia.org/wiki/Triangular_distribution
	if (arguments.length != 3) {                         // ARG_CHECK                     
		throw new SyntaxError("triangular() must be called" // ARG_CHECK
		+ " with lower, upper and mode parameters");    // ARG_CHECK
	}                                                   // ARG_CHECK
	
	var c = (mode - lower) / (upper - lower);
	var u = this.random();
	
	if (u <= c) {
		return lower + Math.sqrt(u * (upper - lower) * (mode - lower));
	} else {
		return upper - Math.sqrt((1 - u) * (upper - lower) * (upper - mode));
	}
};

Random.prototype.uniform = function (lower, upper) {
	if (arguments.length != 2) {                         // ARG_CHECK                     
		throw new SyntaxError("uniform() must be called" // ARG_CHECK
		+ " with lower and upper parameters");    // ARG_CHECK
	}                                                   // ARG_CHECK
	return lower + this.random() * (upper - lower);
};

Random.prototype.weibull = function (alpha, beta) {
	if (arguments.length != 2) {                         // ARG_CHECK                     
		throw new SyntaxError("weibull() must be called" // ARG_CHECK
		+ " with alpha and beta parameters");    // ARG_CHECK
	}                                                   // ARG_CHECK
	var u = 1.0 - this.random();
	return alpha * Math.pow(-Math.log(u), 1.0 / beta);
};
