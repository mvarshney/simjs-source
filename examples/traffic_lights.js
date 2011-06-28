//if (this.load) {
//	load('../src/sim.js');
//	load('../src/random.js');
//	load('../src/queues.js');
//	load('../src/stats.js');
//	load('../src/request.js');
//	var document = {
//		write: function(msg) {
//			print(msg);
//		}
//	};
//}

(function(SEED, GREEN_TIME, MEAN_ARRIVAL, SIMTIME) {
	var sim = new Sim();
	var random = new Random(SEED);
	var trafficLights = [new Sim.Event("North-South Light"),
                         new Sim.Event("East-West Light")]; 
    var stats = new Sim.Population("Waiting at Intersection");
    
    var LightController = {
        currentLight: 0,  // the light that is turned on currently
        start: function () {
        	sim.log(trafficLights[this.currentLight].name + " OFF"
        			+ ", " + trafficLights[1 - this.currentLight].name + " ON");
        	sim.log("------------------------------------------");
        	// turn off the current light
        	trafficLights[this.currentLight].clear();

        	// turn on the other light.
        	// Note the true parameter: the event must "sustain"
        	trafficLights[1 - this.currentLight].fire(true);

        	// update the currentLight variable
        	this.currentLight = 1 - this.currentLight;

        	// Repeat every GREEN_TIME interval
        	this.setTimer(GREEN_TIME).done(this.start);
        }
    };
    
    var Traffic = {
        start: function () {
        	this.generateTraffic("North", trafficLights[0]); // traffic for North -> South
        	this.generateTraffic("South", trafficLights[0]); // traffic for South -> North
        	this.generateTraffic("East", trafficLights[1]); // traffic for East -> West
        	this.generateTraffic("West", trafficLights[1]); // traffic for West -> East
        },
        generateTraffic: function (direction, light) {
        	// STATS: record that vehicle as entered the intersection
        	stats.enter(this.time());
        	sim.log("Arrive for " + direction);

        	// wait on the light. 
        	// The done() function will be called when the event fires 
        	// (i.e. the light turns green).
        	this.waitEvent(light).done(function () {
        		var arrivedAt = this.callbackData;
        		// STATS: record that vehicle has left the intersection
        		stats.leave(arrivedAt, this.time());
        		sim.log("Leave for " + direction + " (arrived at " + arrivedAt.toFixed(6) + ")");
        	}).setData(this.time());

        	// Repeat for the next car. Call this function again.
        	var nextArrivalAt = random.exponential(1.0 / MEAN_ARRIVAL);
        	this.setTimer(nextArrivalAt).done(this.generateTraffic, this, [direction, light]);
        }
    };
    
    sim.addEntity(LightController);
    sim.addEntity(Traffic);
    
    document.write("<pre>");
//    sim.setLogger(function (str) {
//    	document.write(str);
//    });
    
    // simulate for SIMTIME time
    sim.simulate(SIMTIME); 
    
    document.write("Number of vehicles at intersection (average) = " 
    		+ stats.sizeSeries.average().toFixed(3) 
    		+ " (+/- " + stats.sizeSeries.deviation().toFixed(3)
    		+ ")\n");
    document.write("Time spent at the intersection (average) = " 
    		+ stats.durationSeries.average().toFixed(3)
    		+ " (+/- " + stats.durationSeries.deviation().toFixed(3)
    		+ ")\n");
	
}
(
		1234,  // SEED
		5.0,  // seconds, time that traffic line is green
		1.0,   // mean arrival of vehicles
		30.0   // simulation time
));
