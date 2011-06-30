function trafficLightSimulation(GREEN_TIME, MEAN_ARRIVAL, SEED, SIMTIME) {
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
   
//    Uncomment to display logging information
//    sim.setLogger(function (str) {
//    	document.write(str);
//    });
    
    // simulate for SIMTIME time
    sim.simulate(SIMTIME); 
    
    return [stats.durationSeries.average(),
            stats.durationSeries.deviation(),
            stats.sizeSeries.average(),
            stats.sizeSeries.deviation()];
	
}
