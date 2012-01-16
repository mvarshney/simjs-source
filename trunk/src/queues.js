/** Queues
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
	this.order = 0;
};

Sim.PQueue.prototype.greater = function(ro1, ro2) {
	if (ro1.deliverAt > ro2.deliverAt) return true;
	if (ro1.deliverAt == ro2.deliverAt) 
		return ro1.order > ro2.order;
	return false;
};


/* Root at index 0
 * Parent (i) = Math.floor((i-1) / 2)
 * Left (i) = 2i + 1
 * Right (i) = 2i + 2
 */

Sim.PQueue.prototype.insert = function (ro) {
	ARG_CHECK(arguments, 1, 1);
	ro.order = this.order ++;
	
	var index = this.data.length;
	this.data.push(ro);

	// insert into data at the end
	var a = this.data;
	var node = a[index];

	// heap up
	while (index > 0) {
		var parentIndex = Math.floor((index - 1) / 2);
		if (this.greater(a[parentIndex], ro)) {
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
		  && !this.greater(a[rightChildIndex], a[leftChildIndex])
				? rightChildIndex : leftChildIndex;

		if (this.greater(a[smallerChildIndex], node)) {
			break;
		}

		a[index] = a[smallerChildIndex];
		index = smallerChildIndex;
	}
	a[index] = node;
	return top;
};










