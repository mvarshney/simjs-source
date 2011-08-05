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
	if (this.noRenege) return this;
	
	// if already cancelled, do nothing
	if (this.cancelled) return;
	
	// set flag
	this.cancelled = true;
	
	if (this.deliverAt == 0) {
		this.deliverAt = this.entity.time(); 
	}

	if (this.source) {
		if ((this.source instanceof Sim.Buffer)
				|| (this.source instanceof Sim.Store)) {
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
	if (this.noRenege) return this;
	
	var ro = this._addRequest(this.scheduledAt + delay, callback, context, argument);
	this.entity.sim.queue.insert(ro);
	return this;
};


Sim.Request.prototype.unlessEvent = function (event, callback, context, argument) {
	ARG_CHECK(arguments, 1, 4, undefined, Function, Object);
	if (this.noRenege) return this;
	
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
	//this.cancel = this.Null;
	//this.waitUntil = this.Null;
	//this.unlessEvent = this.Null;
	this.noRenege = true;
	
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
		
		context.callbackSource = null;
		context.callbackMessage = null;
		context.callbackData = null;
	}
};