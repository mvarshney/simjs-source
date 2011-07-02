function testPoolSimple() {
	var sim = new Sim();
	var pool = new Sim.Pool('pool', 100);
	
	var Entity = {
		start: function () {
			// allocate 80 units first
			this.allocPool(pool, 80).done(function () {
				assertEquals(this.time(), 0);
				assertEquals(this.callbackSource, pool);
				assertEquals(pool.available, 20);
			});
			
			// try to allocate 50 more, should block
			this.allocPool(pool, 50).done(function (p) {
				assertEquals(this.time(), 10);
				assertEquals(this.callbackSource, pool);
				assertEquals(pool.available, 10);
			});
			
			// free up 20 units at 5 sec (should still block)
			this.setTimer(5).done(function() {
				this.freePool(pool, 20);
				assertEquals(pool.available, 40);
			});
			
			// free up 20 more at 5, should get the second request
			this.setTimer(10).done(function () {
				this.freePool(pool, 20);
				assertEquals(pool.available, 10);
			});
			
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 10);
			assertEquals(pool.available, 10);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testPoolSimple2() {
	var sim = new Sim();
	var pool = new Sim.Pool('pool', 100);
	
	var Entity = {
		start: function () {
			this.setTimer(20).done(function() {
				this.allocPool(pool, 80)
				.done(function(){ this.count = 1;});
			});
						
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 20);
			assertEquals(pool.available, 20);
			assertEquals(this.count, 1);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}


function testPoolTimeout() {
	var sim = new Sim();
	var pool = new Sim.Pool('pool', 100);
	
	var Entity = {
		start: function () {
			// allocate 80 units first
			this.allocPool(pool, 80).done(function () {
				assertEquals(this.time(), 0);
				assertEquals(this.callbackSource, pool);
			});
			
			// try to allocate 50 more, set timeout
			this.allocPool(pool, 50)
			.done(function (p) {
				assertFail();
			})
			.waitUntil(5, function() {
				assertEquals(this.time(), 5);
				this.count = 1;
			});
			
			// free up 80 units at 5 sec. However the previous request was timeout
			this.setTimer(6).done(function() {
				this.freePool(pool, 70);
			});
			
		},
		finalize: function () {
			finalized++;
			assertEquals(this.count, 1);
			assertEquals(this.time(), 6);
			assertEquals(pool.available, 90);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testPoolFreeMore() {
	var sim = new Sim();
	var pool = new Sim.Pool('pool', 100);
	
	var Entity = {
		start: function () {
			// allocate 20 units first
			this.allocPool(pool, 20).done();
			
			// give 50 units back
			this.freePool(pool, 50);
			
			// But we cannot get back 110 units
			this.allocPool(pool, 110).done(function() {
				assertFail();
			})
			.waitUntil(10, function () {
				this.count = 1;
			});
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 10);
			assertEquals(pool.available, 100);
			assertEquals(this.count, 1);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testPoolIncreaseCapacity() {
	var sim = new Sim();
	var pool = new Sim.Pool('pool', 100);
	
	var Entity = {
		start: function () {
			// allocate 110 units first, should block
			this.allocPool(pool, 110).done(function() {
				assertEquals(this.time(), 10);
				assertEquals(pool.available, 40);
				this.count = 1;
			});
			
			this.setTimer(10).done(function() {
				pool.increaseCapacity(50);
			});
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 10);
			assertEquals(pool.available, 40);
			assertEquals(this.count, 1);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testPoolDecreaseCapacity() {
	var sim = new Sim();
	var pool = new Sim.Pool('pool', 100);
	
	var Entity = {
		count: 0,
		start: function () {
			// decrease capacity to 50
			pool.decreaseCapacity(50);
			
			// request of 60 units should fail
			this.allocPool(pool, 60)
			.done(function () { assertFail(); })
			.waitUntil(0, function() {
				assertEquals(this.time(), 0);
				this.count++;
			});
			
			// request of 40 units should be satisfied
			this.allocPool(pool, 40)
			.done(function () { 
				assertEquals(this.time(), 0);
				this.count++;})
			.waitUntil(0, function() {
				assertFail();
			});
			
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 0);
			assertEquals(pool.available, 10);
			assertEquals(this.count, 2);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function t2estPoolDecreaseCapacityAfterAlloc() {
	var sim = new Sim();
	var pool = new Sim.Pool('pool', 100);
	
	var Entity = {
		count: 0,
		start: function () {
			// request of 80 units should be satisfied
			this.allocPool(pool, 40)
			.done(function () { 
				assertEquals(this.time(), 0);
				this.count++;})
			.waitUntil(0, function() {
				assertFail();
			});
			
			// decrease capacity to 50. Still available = 20
			this.setTimer(10).done(function() {
				pool.decreaseCapacity(50);	
			});
			
			// request 20 units. It is okay since available was as before
			this.setTimer(20).done(function() {
				this.allocPool(pool, 40)
				.done(function () { 
					assertEquals(this.time(), 20);
					this.count++;
				})
				.waitUntil(0, function() {
					assertFail();
				});
			});
		},
		finalize: function () {
			finalized++;
			assertEquals(pool.available, 10);
			assertEquals(this.count, 2);
			assertEquals(this.time(), 20);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}