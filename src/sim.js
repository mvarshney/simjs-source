/** SIM.JS Library.
 * 
 * Discrete Event Simulation in JavaScript.
 * 
 * Author: Maneesh Varshney (mvarshney@gmail.com)
 * License: LGPL
 */

/** Simulator Object
 * 
 */
function Sim() {
	this.simTime = 0;
	this.entities = [];
	this.queue = new Sim.PQueue();
	this.endTime = 0;
	this.entityId = 1;
}

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
	//ARG_CHECK(arguments, 1, 1, Object);
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
		
		proto.putStore = function (store, obj) {
			ARG_CHECK(arguments, 2, 2, Sim.Store);
			
			var ro = new Sim.Request(this, this.sim.time(), 0);
			ro.source = store;
			store.put(obj, ro);
			return ro;
		};
		
		proto.getStore = function (store, filter) {
			ARG_CHECK(arguments, 1, 2, Sim.Store, Function);
			
			var ro = new Sim.Request(this, this.sim.time(), 0);
			ro.source = store;
			store.get(filter, ro);
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
			
			this.sim.log(message, this);
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
	obj.id = this.entityId ++;
	this.entities.push(obj);
	
	if (arguments.length > 1) {
		var args = [];
		for (var i = 1; i < arguments.length; i ++) {
			args.push(arguments[i]);
		}
		obj.start.apply(obj, args);
	}
	else {
		obj.start();
	}
	
	
	return obj;
};


Sim.prototype.simulate = function (endTime, maxEvents) {
	//ARG_CHECK(arguments, 1, 2);
	if (!maxEvents) {maxEvents = Math.Infinity; }
	var events = 0;
	
	while (true) {
		events ++;
		if (events > maxEvents) return false;
		
		// Get the earliest event
		var ro = this.queue.remove();
		
		// If there are no more events, we are done with simulation here.
		if (ro == undefined) break;


		// Uh oh.. we are out of time now
		if (ro.deliverAt > endTime) break;
		
		// Advance simulation time
		this.simTime =  ro.deliverAt;
		
		// If this event is already cancelled, ignore
		if (ro.cancelled) continue;

		ro.deliver();
	}
	
	this.finalize();
	return true;
};

Sim.prototype.step = function () {
	while (true) {
		var ro = this.queue.remove();
		if (!ro) return false;
		this.simTime = ro.deliverAt;
		if (ro.cancelled) continue;
		ro.deliver();
		break;
	}
	return true;
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
	if (entity !== undefined) {
		if (entity.name) {
			entityMsg = " [" + entity.name + "]";
		} else {
			entityMsg = " [" + entity.id + "] ";
		}
	}
	this.logger(this.simTime.toFixed(6)
			+ entityMsg
			+ "   " 
			+ message);
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

Sim.Facility = function (name, discipline, servers, maxqlen) {
	ARG_CHECK(arguments, 1, 4);
	
	this.free = servers ? servers : 1;
	this.servers = servers ? servers : 1;
	this.maxqlen = (maxqlen === undefined) ? -1 : 1 * maxqlen;
	
	switch (discipline) {

	case Sim.Facility.LCFS:
		this.use = this.useLCFS;
		this.queue = new Sim.Queue();
		break;
	case Sim.Facility.PS:
		this.use = this.useProcessorSharing;
		this.queue = [];
		break;
	case Sim.Facility.FCFS:
	default:
		this.use = this.useFCFS;
		this.freeServers = new Array(this.servers);
		this.queue = new Sim.Queue();
		for (var i = 0; i < this.freeServers.length; i++) {
			this.freeServers[i] = true;
		}
	}
	
	this.stats = new Sim.Population();
	this.busyDuration = 0;
};

Sim.Facility.FCFS = 1;
Sim.Facility.LCFS = 2;
Sim.Facility.PS = 3;
Sim.Facility.NumDisciplines = 4;

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

Sim.Facility.prototype.useFCFS = function (duration, ro) {
	ARG_CHECK(arguments, 2, 2);
	if ( (this.maxqlen === 0 && !this.free)
	 		|| (this.maxqlen > 0 && this.queue.size() >= this.maxqlen)) {
		ro.msg = -1;
		ro.deliverAt = ro.entity.time();
		ro.entity.sim.queue.insert(ro);
		return;
	}
	
	ro.duration = duration;
	var now = ro.entity.time();
	this.stats.enter(now);
	this.queue.push(ro, now);
	this.useFCFSSchedule(now);
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
		
		// cancel all other reneging requests
		ro.cancelRenegeClauses();
		
		var newro = new Sim.Request(this, timestamp, timestamp + ro.duration);
		newro.done(this.useFCFSCallback, this, ro);

		ro.entity.sim.queue.insert(newro);
	}
};

Sim.Facility.prototype.useFCFSCallback = function (ro) {
	// We have one more free server
	this.free ++;
	this.freeServers[ro.msg] = true;

	this.stats.leave(ro.scheduledAt, ro.entity.time());
	
	// if there is someone waiting, schedule it now
	this.useFCFSSchedule(ro.entity.time());
	
	// restore the deliver function, and deliver
	ro.deliver();
	
}

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

Sim.Facility.prototype.useProcessorSharing = function (duration, ro) {
	ARG_CHECK(arguments, 2, 2, null, Sim.Request);
	ro.duration = duration;
	ro.cancelRenegeClauses();
	this.stats.enter(ro.entity.time());
	this.useProcessorSharingSchedule(ro, true);
};

Sim.Facility.prototype.useProcessorSharingSchedule = function(ro, isAdded) {
	var current = ro.entity.time();
	var size = this.queue.length;
	var multiplier = isAdded ? ((size + 1.0) / size) : ((size - 1.0) / size);
	var newQueue = [];
	
	if (this.queue.length === 0) {
		this.lastIssued = current;
	}
	
	for (var i = 0; i < size; i++) {
		var ev = this.queue[i];
		if (ev.ro === ro) {
			continue;
		}
		var newev = new Sim.Request(this, current, current + (ev.deliverAt - current) * multiplier);
		newev.ro = ev.ro;
		newev.source = this;
		newev.deliver = this.useProcessorSharingCallback;
		newQueue.push(newev);
		
		ev.cancel();
		ro.entity.sim.queue.insert(newev);
	}
	
	// add this new request
	if (isAdded) {
		var newev = new Sim.Request(this, current, current + ro.duration * (size + 1));
		newev.ro = ro;
		newev.source = this;
		newev.deliver = this.useProcessorSharingCallback;
		newQueue.push(newev);
		
		ro.entity.sim.queue.insert(newev);
	}
	
	this.queue = newQueue;
	
	// usage statistics
	if (this.queue.length == 0) {
		this.busyDuration += (current - this.lastIssued);
	} 
};

Sim.Facility.prototype.useProcessorSharingCallback = function () {
	var ev = this;
	var fac = ev.source;
	
	if (ev.cancelled) return;
	fac.stats.leave(ev.ro.scheduledAt, ev.ro.entity.time());

	fac.useProcessorSharingSchedule(ev.ro, false);
	ev.ro.deliver();
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


/** Store
 * 
 */

Sim.Store = function (name, capacity) {
	ARG_CHECK(arguments, 2, 3);
	
	this.name = name;
	this.capacity = capacity;
	this.objects = [];
	this.putQueue = new Sim.Queue();
	this.getQueue = new Sim.Queue();
};

Sim.Store.prototype.current = function () {
	return this.objects.length;
};

Sim.Store.prototype.size = function () {
	return this.capacity;
};

Sim.Store.prototype.get = function (filter, ro) {
	ARG_CHECK(arguments, 2, 2);
	
	if (this.getQueue.empty() && this.current() > 0) {
		var found = false;
		var obj;
		// TODO: refactor this code out
		// it is repeated in progressGetQueue
		if (filter) {
			for (var i = 0; i < this.objects.length; i++) {
				obj = this.objects[i];
				if (filter(obj)) {
					found = true;
					this.objects.splice(i, 1);
					break;
				}
			}
		} else {
			obj = this.objects.shift();
			found = true;
		}
		
		if (found) {
			this.available --;
			
			ro.msg = obj;
			ro.deliverAt = ro.entity.time();
			ro.entity.sim.queue.insert(ro);

			this.getQueue.passby(ro.deliverAt);

			this.progressPutQueue();

			return;
		}
	}
	
	ro.filter = filter;
	this.getQueue.push(ro, ro.entity.time());
};

Sim.Store.prototype.put = function (obj, ro) {
	ARG_CHECK(arguments, 2, 2);

	if (this.putQueue.empty() && this.current() < this.capacity) {
		this.available ++;
		
		ro.deliverAt = ro.entity.time();
		ro.entity.sim.queue.insert(ro);
		
		this.putQueue.passby(ro.deliverAt);
		this.objects.push(obj);
		
		this.progressGetQueue();
		
		return;
	}

	ro.obj = obj;
	this.putQueue.push(ro, ro.entity.time());
};

Sim.Store.prototype.progressGetQueue = function () {
	var ro;
	while (ro = this.getQueue.top()) {
		// if obj is cancelled.. remove it.
		if (ro.cancelled) {
			this.getQueue.shift(ro.entity.time());
			continue;
		} 
		
		// see if this request can be satisfied
		if (this.current() > 0) {
			var filter = ro.filter;
			var found = false;
			var obj;
			
			if (filter) {
				for (var i = 0; i < this.objects.length; i++) {
					obj = this.objects[i];
					if (filter(obj)) {
						found = true;
						this.objects.splice(i, 1);
						break;
					}
				}
			} else {
				obj = this.objects.shift();
				found = true;
			}
			
			if (found) {
				// remove it..
				this.getQueue.shift(ro.entity.time());
				this.available --;
				
				ro.msg = obj;
				ro.deliverAt = ro.entity.time();
				ro.entity.sim.queue.insert(ro);
			} else {
				break;
			}
		
		} else {
			// this request cannot be satisfied
			break;
		}
	}
};

Sim.Store.prototype.progressPutQueue = function () {
	var ro;
	while (ro = this.putQueue.top()) {
		// if obj is cancelled.. remove it.
		if (ro.cancelled) {
			this.putQueue.shift(ro.entity.time());
			continue;
		} 
		
		// see if this request can be satisfied
		if (this.current() < this.capacity) {
			// remove it..
			this.putQueue.shift(ro.entity.time());
			this.available ++;
			this.objects.push(ro.obj);
			ro.deliverAt = ro.entity.time();
			ro.entity.sim.queue.insert(ro);
		} else {
			// this request cannot be satisfied
			break;
		}
	}
};

Sim.Store.prototype.putStats = function () {
	return this.putQueue.stats;
};

Sim.Store.prototype.getStats = function () {
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
	var tmpList = this.waitList;
	this.waitList = [];
	for (var i = 0; i < tmpList.length; i ++) {
		tmpList[i].deliver();
	}
	
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

