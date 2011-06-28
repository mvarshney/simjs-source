
function testTimerPlain() {
	var sim = new Sim();
	
	var Entity = {
		start: function () {
			this.setTimer(10).done(this.onTimeout);
		},
		onTimeout: function () {
			this.count = 1;
			assertEquals(this.time(), 10);
		},
		finalize: function () {
			assertEquals(this.count, 1);
			assertEquals(this.time(), 10);
			finalized ++;
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testTimerCustomDone() {
	var sim = new Sim();
	
	var Entity = {
		start: function () {
			this.setTimer(10).done(this.onTimeout);
		},
		onTimeout: function () {
			this.count = 1;
			assertEquals(this.time(), 10);
		},
		finalize: function () {
			assertEquals(this.count, 1);
			assertEquals(this.time(), 10);
			finalized ++;
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testTimerCustomDoneInline() {
	var sim = new Sim();
	
	var Entity = {
		start: function () {
			this.setTimer(10).done(function (){ 
				assertEquals(this.time(), 10);
				this.count = 1; 
			});
		},
		finalize: function () {
			assertEquals(this.count, 1);
			assertEquals(this.time(), 10);
			finalized ++;
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testTimerRecursive() {
	var sim = new Sim();
	
	var Entity = {
		count: 0,
		start: function () {
			assertEquals(this.time(), 10 * this.count);
			this.count ++;
			this.setTimer(10).done(this.start);
		},
		finalize: function () {
			assertEquals(this.count, 11);
			assertEquals(this.time(), 100);
			finalized ++;
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testTimerNoEvent() {
	var sim = new Sim();
	
	var Entity = {
		start: function () {},
		finalize: function () { 
			finalized ++; 
			assertEquals(this.time(), 0);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testTimerZero() {
	var sim = new Sim();
	
	var Entity = {
		start: function () {
			this.setTimer(0).done(function () {
				assertEquals(this.time(), 0);
			});
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 0);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}	


function testTimerTimeout1() {
	var sim = new Sim();
	
	var Entity = {
		start: function () {
			this.setTimer(10)
			.done(function () {
				assertFail();
			})
			.waitUntil(5, function () {
				assertEquals(this.time(), 5);
				this.count = 1;
			});
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 10);
			assertEquals(this.count, 1);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testTimerTimeout2() {
	var sim = new Sim();
	
	var Entity = {
		start: function () {
			this.setTimer(10)
			.done(function () {
				assertEquals(this.time(), 10);
				this.count = 1;
			})
			.waitUntil(20, function () {
				assertFail();
			});
		},
		finalize: function () {
			finalized++;
			assertEquals(this.count, 1);
			assertEquals(this.time(), 20);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testTimerMultipleTimeouts() {
	var sim = new Sim();
	
	var Entity = {
		start: function () {
			this.setTimer(50)
			.done(function () {
				assertFail();
			})
			.waitUntil(20, function () {
				assertFail();
			})
			.waitUntil(10, function () {
				assertEquals(this.time(), 10);
				this.count = 1;
			});
			
		},
		finalize: function () {
			finalized++;
			assertEquals(this.count, 1);
			assertEquals(this.time(), 50);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testTimerWaitEvent() {
	var sim = new Sim();
	var event = new Sim.Event();
	
	var Entity = {
		start: function () {
			this.setTimer(50)
			.done(function () {
				assertFail();
			})
			.unlessEvent(event, function() {
				assertEquals(this.time(), 10);
				this.count = 1;
			});
			
			this.setTimer(10).done(function() {
				event.fire();
			});
			
		},
		finalize: function () {
			finalized++;
			assertEquals(this.count, 1);
			assertEquals(this.time(), 50);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}
