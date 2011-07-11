function testBufferBlockedPuts() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('a', 100);

	var Entity = {
		count: 0,
		start: function () {
			// at time 0, put 60 units -- succeed
			this.putBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 0);
				this.count++;
			});
			
			// put 60 units -- wait, since not enough space
			this.putBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});

			// put 60 units -- wait, since there is a request already waiting
			this.putBuffer(buffer, 15).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});

			// put 60 units -- wait, since there is a request already waiting
			this.putBuffer(buffer, 10).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});
			
			this.setTimer(10).done(this.getBuffer, this, [buffer, 60]);
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 4);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testBufferBlockedGet() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('a', 100, 100);

	var Entity = {
		count: 0,
		start: function () {
			// at time 0, put 60 units -- succeed
			this.getBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 0);
				this.count++;
			});
			
			// put 60 units -- wait, since not enough space
			this.getBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});

			// put 60 units -- wait, since there is a request already waiting
			this.getBuffer(buffer, 15).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});

			// put 60 units -- wait, since there is a request already waiting
			this.getBuffer(buffer, 10).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});
			
			this.setTimer(10).done(this.putBuffer, this, [buffer, 60]);
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 4);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testBufferPutStillWaits() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('a', 100);

	var Entity = {
		count: 0,
		start: function () {
			// at time 0, put 60 units -- succeed
			this.putBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 0);
				this.count++;
			});
			
			// put 60 units -- wait, since not enough space
			this.putBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});

			// put 60 units -- wait, since there is a request already waiting
			this.putBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 20);
				this.count++;
			});

			// put 60 units -- wait, since there is a request already waiting
			this.putBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 30);
				this.count++;
			});
			
			this.setTimer(10).done(this.getBuffer, this, [buffer, 60]);
			this.setTimer(20).done(this.getBuffer, this, [buffer, 60]);
			this.setTimer(30).done(this.getBuffer, this, [buffer, 60]);
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 4);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testBufferGetStillWaits() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('a', 100, 100);

	var Entity = {
		count: 0,
		start: function () {
			// at time 0, put 60 units -- succeed
			this.getBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 0);
				this.count++;
			});
			
			// put 60 units -- wait, since not enough space
			this.getBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});

			// put 60 units -- wait, since there is a request already waiting
			this.getBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 20);
				this.count++;
			});

			// put 60 units -- wait, since there is a request already waiting
			this.getBuffer(buffer, 60).done(function () {
				assertEquals(this.time(), 30);
				this.count++;
			});
			
			this.setTimer(10).done(this.putBuffer, this, [buffer, 60]);
			this.setTimer(20).done(this.putBuffer, this, [buffer, 60]);
			this.setTimer(30).done(this.putBuffer, this, [buffer, 60]);
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 4);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}


function testBufferGetCancel() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('a', 100, 40);

	var Entity = {
		count: 0,
		start: function () {
			// at time 0, get 60 units -- waits
			var ro = this.getBuffer(buffer, 60).done(function () {
				assertFail;
			});
			
			
			// get 30, wait since there is request is front
			this.getBuffer(buffer, 30).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});
		
			this.setTimer(10).done(ro.cancel, ro);
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 1);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testBufferPutCancel() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('a', 100);

	var Entity = {
		count: 0,
		start: function () {
			// at time 0, put 110 units -- waits
			var ro = this.putBuffer(buffer, 110).done(function () {
				assertFail;
			});
			
			
			// put 30, wait since there is request is front
			this.putBuffer(buffer, 30).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});
		
			this.setTimer(10).done(ro.cancel, ro);
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 1);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testBufferPutTimeout() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('a', 100);

	var Entity = {
		count: 0,
		start: function () {
			// at time 0, put 110 units -- waits
			var ro = this.putBuffer(buffer, 110)
			.done(assertFail).
			waitUntil(10);
			
			
			// put 30, wait since there is request is front
			this.putBuffer(buffer, 30).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});
	
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 1);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testBufferPutEventRenege() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('a', 100);
	var event = new Sim.Event('a');

	var Entity = {
		count: 0,
		start: function () {
			// at time 0, put 110 units -- waits
			var ro = this.putBuffer(buffer, 110)
			.done(assertFail)
			.unlessEvent(event);
			
			this.setTimer(10).done(event.fire, event);
			
			
			// put 30, wait since there is request is front
			this.putBuffer(buffer, 30).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});
	
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 1);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testBufferGetTimeout() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('a', 100, 100);

	var Entity = {
		count: 0,
		start: function () {
			// at time 0, get 110 units -- waits
			var ro = this.getBuffer(buffer, 110)
			.done(assertFail).
			waitUntil(10);
			
			
			// get 30, wait since there is request is front
			this.getBuffer(buffer, 30).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});
	
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 1);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testBufferGetEventRenege() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('a', 100, 100);
	var event = new Sim.Event('a');

	var Entity = {
		count: 0,
		start: function () {
			// at time 0, get 110 units -- waits
			var ro = this.getBuffer(buffer, 110)
			.done(assertFail)
			.unlessEvent(event);
			
			this.setTimer(10).done(event.fire, event);
			
			
			// get 30, wait since there is request is front
			this.getBuffer(buffer, 30).done(function () {
				assertEquals(this.time(), 10);
				this.count++;
			});
	
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 1);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}
