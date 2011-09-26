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
			this.histogram[0] += w; 
		}
		else if (value > this.hUpper) { 
			this.histogram[this.histogram.length - 1] += w;
		} else {
			var index = Math.floor((value - this.hLower) / this.hBucketSize) + 1;
			this.histogram[index] += w;
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
	this.dataSeries.setHistogram(lower, upper, nbuckets);
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


