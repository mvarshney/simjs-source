function testDataSeries() {
	// ai = i, wi = 0
	var m = new Sim.DataSeries();
	
	for (var i = 1; i <= 100; i ++) {
		m.record(i);
	}
	assertAlmost(m.average(), 50.5);
	assertAlmost(m.deviation(), 28.8660700477);
	assertAlmost(m.variance(), 833.25);
	assertAlmost(m.min(), 1.0);
	assertAlmost(m.max(), 100.0);
	assertAlmost(m.range(), 99.0);
	assertAlmost(m.sum(), 5050.0);
	assertAlmost(m.sumWeighted(), 5050.0);
	
	// ai = i, wi = 1 / i
	m.reset();
	for (var i = 1; i <= 100; i ++) {
		m.record(i, 1.0/i);
	}
	assertAlmost(m.average(), 19.277563597396004);
	assertAlmost(m.variance(), 601.89250341685056);
	assertAlmost(m.sumWeighted(), 100.0);
	assertAlmost(m.min(), 1.0);
	assertAlmost(m.max(), 100.0);
	assertAlmost(m.range(), 99.0);
	assertAlmost(m.sum(), 5050.0);
	
	m.reset();
	for (var i = 1; i <= 100; i ++) {
		m.record(i, 2.0 *i);
	}
	assertAlmost(m.average(), 67.0);
	assertAlmost(m.variance(), 561.0);
	assertAlmost(m.min(), 1.0);
	assertAlmost(m.max(), 100.0);
	assertAlmost(m.range(), 99.0);
	assertAlmost(m.sum(), 5050.0);
}

function testTimeSeries () {
	var m = new Sim.TimeSeries();
	
	// ai = i, ti = i
	for (var i = 1; i <= 100; i++) {
		m.record(i, i);
	}
	
	m.finalize(101);
	assertAlmost(m.average(), 50.5);
	assertAlmost(m.deviation(), 28.8660700477);
	assertAlmost(m.variance(), 833.25);
	assertAlmost(m.min(), 1.0);
	assertAlmost(m.max(), 100.0);
	assertAlmost(m.range(), 99.0);
	assertAlmost(m.sum(), 5050.0);
	
	// ai = 1, ti = i
	m.reset();
	for (var i = 1; i <= 100; i++) {
		m.record(1, i);
	}
	m.finalize(100);
	
	assertAlmost(m.average(), 1.0);
	assertAlmost(m.variance(), 0);
	assertAlmost(m.min(), 1.0);
	assertAlmost(m.max(), 1.0);
	assertAlmost(m.range(), 0.0);
	assertAlmost(m.sum(), 100.0);
	
	// custom
	m.reset();
	m.record(0, 0);
	m.record(100, 10);
	m.record(0, 100);
	assertAlmost(m.average(), 90.0);
	
	// with zero intervals
	var m = new Sim.TimeSeries();
	m.reset();
	m.record(1, 0);
	m.record(100, 1);
	m.record(1, 1);
	m.record(0, 2);
	assertAlmost(m.average(), 1.0);
}

function testPopulation() {
	var m = new Sim.Population();
	
	// test basic
	for (var i = 0; i < 100; i++) {
		m.enter(i);
		m.leave(i, i+1);
	}
	assertAlmost(m.sizeSeries.average(), 1.0);
	assertAlmost(m.durationSeries.average(), 1.0);
	assertAlmost(m.sizeSeries.min(), 0);
	assertAlmost(m.sizeSeries.max(), 1);
	
	// test reset
	m.reset();
	for (var i = 0; i < 100; i++) {
		m.enter(i);
		m.leave(i, i+1);
	}
	assertAlmost(m.sizeSeries.average(), 1.0);
	assertAlmost(m.durationSeries.average(), 1.0);
	
	// ai arrive at i and leave at 100
	m.reset();
	for (var i = 0; i < 100; i++) {
		m.enter(i);
		m.leave(i, 100);
	}
	assertAlmost(m.sizeSeries.average(), 50.5);
	assertAlmost(m.durationSeries.average(), 50.5);
	
	// two enters and then two leaves
	m.reset();
	m.enter(0);
	m.enter(0);
	m.leave(0, 1);
	m.leave(0, 1);
	m.finalize(1);
	assertAlmost(m.sizeSeries.average(), 2);
	assertAlmost(m.durationSeries.average(), 1.0);
	
	// nested enter leave
	m.reset();
	m.enter(0);
	m.enter(1);
	m.leave(1, 2);
	m.leave(0, 3);
	m.finalize(3);
	assertAlmost(m.sizeSeries.average(), 4.0/3);
	assertAlmost(m.durationSeries.average(), 2.0);
	
	// overlapped enter leave
	m.reset();
	m.enter(0);
	m.enter(1);
	m.leave(0, 2);
	m.leave(1, 3);
	m.finalize(3);
	assertAlmost(m.sizeSeries.average(), 4.0/3);
	assertAlmost(m.durationSeries.average(), 2.0);
}

function testHistogram() {
	var m = new Sim.DataSeries();
	
	m.setHistogram(0.5, 99.5, 99);
	for (var i = 0; i <= 100; i++) {
		m.record(i);
	}
	
	var h = m.getHistogram();
	for (var i = 0; i <= 100; i++) {
		assertEquals(h[i], 1);
	}
}