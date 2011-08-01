function testEventFlash() {
	var sim = new Sim();
	var event = new Sim.Event('event');
	
	var Entity = {
		count: 0,
		start: function () {
			assertEquals(event.isFired, false);
			
			this.waitEvent(event).done(function () {
				assertEquals(event.isFired, false);
				assertEquals(this.callbackSource, event);
				assertEquals(this.time(), 10);
				this.count ++;
			});
			
			this.setTimer(10).done(function () {
				assertEquals(event.isFired, false);
				event.fire(); 
			});

			this.setTimer(20).done(function () {
				assertEquals(event.isFired, false);
				this.waitEvent(event).done(function (s) {
					assertEquals(this.callbackSource, event);
					assertEquals(this.time(), 21);
					this.count ++;
				});
			});
			this.setTimer(21).done(function () { 
				assertEquals(event.isFired, false);
				event.fire();
				assertEquals(event.isFired, false);
				});
			
			
			
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 21);
			assertEquals(this.count, 2);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testEventSustain() {
	var sim = new Sim();
	var event = new Sim.Event('event');
	
	var Entity = {
		count: 0,
		start: function () {
			assertEquals(event.isFired, false);
			
			this.waitEvent(event).done(function (s) {
				assertEquals(event.isFired, true);
				assertEquals(this.callbackSource, event);
				assertEquals(this.time(), 10);
				this.count ++;
			});
			this.setTimer(10).done(function () {
				assertEquals(event.isFired, false);
				event.fire(true);
				assertEquals(event.isFired, true);
				});

			this.setTimer(20).done(function () {
				assertEquals(event.isFired, true);
				this.waitEvent(event).done(function (s) {
					assertEquals(this.callbackSource, event);
					assertEquals(this.time(), 20);
					this.count ++;
				});
			});
			
			this.setTimer(30).done(function () { 
				assertEquals(event.isFired, true);
				event.clear();
				assertEquals(event.isFired, false);
				});
			this.setTimer(40).done(function () {
				assertEquals(event.isFired, false);
				this.waitEvent(event).done(function (s) {
					assertEquals(this.callbackSource, event);
					assertEquals(this.time(), 41);
					this.count ++;
				});
			});
			
			this.setTimer(41).done(function () { event.fire(true); });
			
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 41);
			assertEquals(this.count, 3);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testEventWaitQueue () {
	var barrier = new Sim.Event('Barrier');
	var funnel = new Sim.Event('Funnel');
	var wcount = 0;
	var qcount = 0;
	var Entity = {
	    start: function (master) {
	        this.waitEvent(barrier).done(function () {
	            wcount++;
	        });

	        this.queueEvent(funnel).done(function () {
	            qcount++;
	        });

	        if (master) {
	            this.setTimer(10)
	            .done(barrier.fire, barrier)
	            .done(funnel.fire, funnel);
	        }
	    },
	    finalize: function () {
	    	finalized ++;
	    }
	};

	var sim = new Sim();
	var e = [];
	for (var i = 0; i < 100; i++) {
	    e.push(sim.addEntity(Entity, i == 0));
	}
	sim.simulate(100);
	entities = 100;
	assertEquals(wcount, 100);
	assertEquals(qcount, 1);
}