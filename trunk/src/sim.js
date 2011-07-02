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

