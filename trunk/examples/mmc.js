
if (this.load) {
	load('../../sim.js');
	load('../../rand.js');
	load('../../stats.js');
	load('../../queues.js');
	document = {
			write: function (str) {
				print(str);
			}
		};
} else {
	document.write("<pre>");
}


function RunMMc(lambda, mu, nservers, simtime, seed) {
	var sim = new Sim();
	var server = new Sim.Facility('server', Sim.Facility.FCFS, nservers);
	var rand = new Random((seed !== undefined) ? seed : 12345);
	var Generator = {
		start: function () {
			this.useFacility(server, rand.exponential(mu));
			this.setTimer(rand.exponential(lambda)).done(this.start);
		}
	};

	sim.addEntity(Generator);
	sim.simulate((simtime !== undefined) ? simtime : 20000);
	server.finalize(sim.time());
	
	/** Expected results */
	var rho = lambda / mu;
	var Expected = {
		// Expected number of users in system
		N: rho / (1.0 - rho),
		// Variance of number of users in system
		S: rho / ( (1 - rho) * (1 - rho)),
		
		// Expected number of requests in the server
		Ns: rho,
		// Expected number of requests in the queue
		Nq: rho * rho / (1 - rho),
		
		// Total expected waiting time (queue + service)
		T: 1.0 / (mu - lambda),
		// Expected waiting time in queue
		W: rho / (mu - lambda)
	};
	
	/** Obtained results */
	var Obtained = {
		N: server.systemStats().sizeSeries.average(),
		S: server.systemStats().sizeSeries.variance(),
		Ns: server.usage() / sim.time(),
		Nq: server.queueStats().sizeSeries.average(),
		T: server.systemStats().durationSeries.average(),
		W: server.queueStats().durationSeries.average()	
	};
	
	document.write("M/M/c Simulation (lambda=" + lambda + ", mu=" + mu + ", c=" + nservers + ")\n");
	var fields = ['N', 'S', 'Ns', 'Nq', 'T', 'W'];
	for (var field in fields) {
		var name = fields[field];
		document.write(name 
				+ ": Expected = " + Expected[name].toFixed(2) 
				+ "   Obtained = " + Obtained[name].toFixed(2)
				+ "\n");
	}
}


var cases = [[0.2, 1.0],
             [0.3, 1.0],
             [0.4, 1.0],
             [0.5, 1.0],
             [0.6, 1.0],
             [0.7, 1.0],
             [0.8, 1.0],
             [0.9, 1.0]];
for (var c in cases) {
	cc = cases[c];
	var start = new Date().getTime();
	var a = RunMMc(cc[0], cc[1], 1, 100000, 543);
	var end = new Date().getTime();
	document.write("completed in " + (end - start) + " ms\n\n");
	break;
}
//RunMMc(0.5, 1.0, 1, 100, 3);







