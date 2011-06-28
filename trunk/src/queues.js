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
	this.data.push(value);
	this.timestamp.push(timestamp);
	
	this.stats.enter(timestamp);
};

Sim.Queue.prototype.unshift = function (value, timestamp) {
	this.data.unshift(value);
	this.timestamp.unshift(timestamp);
	
	this.stats.enter(timestamp);
};

Sim.Queue.prototype.shift = function (timestamp) {
	var value = this.data.shift();
	var enqueuedAt = this.timestamp.shift();

	this.stats.leave(enqueuedAt, timestamp);
	return value;
};

Sim.Queue.prototype.pop = function (timestamp) {
	var value = this.data.pop();
	var enqueuedAt = this.timestamp.pop();

	this.stats.leave(enqueuedAt, timestamp);
	return value;
};

Sim.Queue.prototype.passby = function (timestamp) {
	this.stats.enter(timestamp);
	this.stats.leave(timestamp, timestamp);
};

Sim.Queue.prototype.finalize = function (timestamp) {
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

