function testFCFSQueueSimple() {
	var q = new Sim.Queue();
	q.push(10, 10);
	q.shift(20);
	q.finalize(10);
	var report = q.report();
	//print (report[0] + " " + report[1] + "\n");
}