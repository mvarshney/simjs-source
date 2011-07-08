function testRequestZeroDelayTimeout() {
	var sim = new Sim();
	var Entity = {
		string: "start",
		start: function () {
			this.setTimer(0)
			.done(function() {
				this.string += "-second";
			});
			this.string += "-first";
		},

		finalize: function () {
			finalized ++;
			assertEquals(this.string, "start-first-second");
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testRequestZeroDelayPutBuffer() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('a', 100);
	var Entity = {
		string: "start",
		start: function () {
			this.putBuffer(buffer, 10)
			.done(function() {
				this.string += "-second";
			});
			this.string += "-first";
		},

		finalize: function () {
			finalized ++;
			assertEquals(this.string, "start-first-second");
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testRequestZeroDelayEventWait() {
	var sim = new Sim();
	var event = new Sim.Event('a');
	
	var Entity = {
		string: "start",
		start: function () {
			event.fire(true);
			
			this.waitEvent(event)
			.done(function() {
				this.string += "-second";
			});
			this.string += "-first";
		},

		finalize: function () {
			finalized ++;
			assertEquals(this.string, "start-first-second");
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testRequestZeroDelayEventQueue() {
	var sim = new Sim();
	var event = new Sim.Event('a');
	
	var Entity = {
		string: "start",
		start: function () {
			event.fire(true);
			
			this.queueEvent(event)
			.done(function() {
				this.string += "-second";
			});
			this.string += "-first";
		},

		finalize: function () {
			finalized ++;
			assertEquals(this.string, "start-first-second");
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testRequestZeroDelayFacility() {
	var sim = new Sim();
	var fac = new Sim.Facility('a');
	
	var Entity = {
		string: "start",
		start: function () {
			
			this.useFacility(fac, 10)
			.done(function() {
				this.string += "-second";
			});
			this.string += "-first";
		},

		finalize: function () {
			finalized ++;
			assertEquals(this.string, "start-first-second");
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testRequestCallbackData() {
	var sim = new Sim();
	var buffer = new Sim.Buffer("buffer", 100);
	var event = new Sim.Event('event');
	
	var Entity = {
			count: 0,
            start: function () {
                this.putBuffer(buffer, 10)
                .done(this.fn1, undefined, 1)
                .unlessEvent(event, this.fn2, null, 2)
                .waitUntil(10, this.fn1, null, 3)
                .setData('my data');
                
                this.putBuffer(buffer, 110)
                .done(this.fn1, null, 1)
                .waitUntil(10, this.fn2, null, 3)
                .setData('my data');
                
                this.putBuffer(buffer, 110)
                .done(this.fn1, this, 1)
                .unlessEvent(event, this.fn1, this, 2)
                .waitUntil(10, assertFail, this, 3)
                .setData('my data');
                
                this.setTimer(5).done(event.fire, event);
                
                // this.userData is undefined outside the callback functions
                assertEquals(this.callbackData, undefined);
            },
            fn1: function (v) {
            	if (this.time() == 0) {
            		assertEquals(v, 1);
            		assertEquals(this.callbackMessage, undefined);
            	} else {
            		assertEquals(v, 2);
            		assertEquals(this.callbackMessage, event);
            	}
            	assertEquals(this.callbackSource, buffer);
            	assertEquals(this.callbackData, 'my data');
                this.count ++;
            },
            fn2: function (v) {
                // this.userData is visible in all callback functions
            	assertEquals(v, 3);
            	assertEquals(this.callbackSource, buffer);
            	assertEquals(this.callbackMessage, undefined);
                assertEquals(this.callbackData, 'my data');
                this.count ++;
            },
        	finalize: function () {
    			finalized ++;
    			assertEquals(this.count, 3);
    		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testRequestSetTimer() {
	var sim = new Sim();
	var event = new Sim.Event('event');

	var Entity = {
		count: 0,
		start: function () {
			var clock = 1;
			
			// basic timers.. testing set data function
			this.setTimer(clock++).setData(1).done(function (d) {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, 1);
				assertEquals(d, undefined);
				this.count ++;
			});
			
			this.setTimer(clock++).done(function (d) {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, 1);
				assertEquals(d, undefined);
				this.count ++;
			}).setData(1);
			
			this.obj = {a: 1, b: 2};
			this.setTimer(clock++).setData(this.obj).done(function (r, m, d) {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, this.obj);
				assertEquals(d, undefined);
				this.count ++;
			});
			
			this.setTimer(clock++).setData('overwritten').done(function (d) {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, 'final');
				assertEquals(d, undefined);
				this.count ++;
			}).setData('final');
			
			// testing callback argument data
			this.setTimer(clock++).setData('overwritten').done(function (d) {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, 'final');
				assertEquals(d, 101);
				this.count ++;
			}, null, 101).setData('final');
			
			this.setTimer(clock++).setData('overwritten').done(function (d) {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, 'final');
				assertEquals(d, undefined);
				this.count ++;
			}, null).setData('final');
			
			this.setTimer(clock++).setData('overwritten').done(function (d) {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, 'final');
				assertEquals(d, this.obj);
				this.count ++;
			}, null, this.obj).setData('final');
			
			this.setTimer(clock++).setData('overwritten').done(function (d, e) {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, 'final');
				assertEquals(d, 101);
				assertEquals(e, 102);
				this.count ++;
			}, null, [101, 102]).setData('final');
			
			// timers bailed out on event
			this.setTimer(clock++)
			.setData('event')
			.done(function (d) {assertFail();})
			.unlessEvent(event, function (d) {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, event);
				assertEquals(this.callbackData, 'event');
				assertEquals(d, undefined);
				this.count ++;
			});
			
			event.fire(true);
			
			this.setTimer(clock++)
			.setData('event')
			.done(function (d) {assertFail();})
			.unlessEvent(event, function (d) {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, event);
				assertEquals(this.callbackData, 'event');
				assertEquals(d, 101);
				this.count ++;
			}, null, 101);
			
			this.setTimer(clock++)
			.setData('event')
			.done(function (d, e) {assertFail();})
			.unlessEvent(event, function (d, e) {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, event);
				assertEquals(this.callbackData, 'event');
				assertEquals(d, 101);
				assertEquals(e, 102);
				this.count ++;
			}, null, [101, 102]);
			
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 11);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

/*
function testRequestPool() {
	var sim = new Sim();
	var pool = new Sim.Pool("pool", 100);
	var event = new Sim.Event('event');

	var Entity = {
		count: 0,
		start: function () {
			// simple alloc -- always succeeds
			this.allocPool(pool, 10).setData('abcd').done(function (d) {
				assertEquals(this.callbackSource, pool);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, 'abcd');
				assertEquals(d, 101);
				this.count ++;
				this.freePool(pool, 10);
			}, this, 101);
			
			this.allocPool(pool, 10).done(function (d, e) {
				assertEquals(this.callbackSource, pool);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, 'abcde');
				assertEquals(d, 101);
				assertEquals(e, 102);
				this.count ++;
				this.freePool(pool, 10);
			}, undefined, [101, 102]).setData('abcde');
			
			// alloc request times out
			this.allocPool(pool, 200).done(function () { assertFail(); })
			.waitUntil(1, function (d) {
				assertEquals(this.callbackSource, pool);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, 'waituntil');
				assertEquals(d, 101);
				this.count ++;
			}, this, 101).setData("waituntil");
			
			// alloc request bails out on event
			this.allocPool(pool, 200).done(function () { assertFail(); })
			.unlessEvent(event, function (d) {
				assertEquals(this.callbackSource, pool);
				assertEquals(this.callbackMessage, event);
				assertEquals(this.callbackData, 'unlessevent');
				assertEquals(d, undefined);
				this.count ++;
			}).setData("unlessevent");
			
			this.setTimer(1).done(event.fire, event);
			
			// alloc request is satisfied later by free request
			this.allocPool(pool, 50); // will be accepted
			
			this.allocPool(pool, 80)
			.setData('1234')
			.done(function (d) {
				assertEquals(this.callbackSource, pool);
				assertEquals(this.callbackMessage, undefined);
				assertEquals(this.callbackData, '1234');
				this.count ++;
				this.freePool(pool, 80);
			});
			
			this.setTimer(1).done(function () {this.freePool(pool, 50); });
			
			if (this.time() == 0) {
				this.setTimer(10).done(this.start);
			}
			
		},
		finalize: function () {
			finalized ++;
			assertEquals(pool.available, 100);
			assertEquals(this.count, 10);
			
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}
*/

function testRequestBuffer() {
	var sim = new Sim();
	var buffer = new Sim.Buffer('buffer', 100);
	var event = new Sim.Event('event');

	var Entity = {
		count: 0,
		start: function () {
			// Basic put and get -- requests are immediately successful
			// put
			this.setTimer(10).done(function () {
				assertEquals(buffer.available, 0);
				this.putBuffer(buffer, 10)
				.setData('abcd')
				.done(function (d) {
					assertEquals(this.callbackSource, buffer);
					assertEquals(this.callbackMessage, undefined);
					assertEquals(this.callbackData, 'abcd');
					assertEquals(d, undefined);
					this.count ++;  // 1
					this.getBuffer(buffer, 10);
					assertEquals(buffer.getQueue.size(), 0);
					assertEquals(buffer.putQueue.size(), 0);
				});
			});
			
			// put
			this.setTimer(20)
			.done(function () {
				assertEquals(buffer.available, 0);
				this.putBuffer(buffer, 10)
				.done(function (d) {
					assertEquals(this.callbackSource, buffer);
					assertEquals(this.callbackMessage, undefined);
					assertEquals(this.callbackData, 'abcde');
					assertEquals(d, 101);
					this.count ++;  // 2
					this.getBuffer(buffer, 10);
					assertEquals(buffer.getQueue.size(), 0);
					assertEquals(buffer.putQueue.size(), 0);
				}, this, 101).setData('abcde');
			});
			
			// get
			this.setTimer(30).done(this.putBuffer, this, [buffer, 10]);
			
			this.setTimer(31).done(function () {
				assertEquals(buffer.available, 10);
				this.getBuffer(buffer, 10)
				.setData('abcd')
				.done(function (d, e) {
					assertEquals(this.callbackSource, buffer);
					assertEquals(this.callbackMessage, undefined);
					assertEquals(this.callbackData, 'abcd');
					assertEquals(d, 101);
					assertEquals(e, 102);
					this.count ++;  // 3
					assertEquals(buffer.getQueue.size(), 0);
					assertEquals(buffer.putQueue.size(), 0);
				}, false, [101, 102]);
			});	
			
			// get
			this.setTimer(40).done(this.putBuffer, this, [buffer, 10]);
			
			this.setTimer(41).done(function () {
				assertEquals(buffer.available, 10);
				this.getBuffer(buffer, 10)
				.done(function (d) {
					assertEquals(this.callbackSource, buffer);
					assertEquals(this.callbackMessage, undefined);
					assertEquals(this.callbackData, 'abcde');
					assertEquals(d, undefined);
					this.count ++;  // 4
					assertEquals(buffer.getQueue.size(), 0);
					assertEquals(buffer.putQueue.size(), 0);
				}).setData('abcde');
			});
			
			// Put and get requests are timed out
			this.setTimer(50).done(function () {
				assertEquals(buffer.available, 0);
				this.getBuffer(buffer, 10)
				.done(function () { assertFail();})
				.waitUntil(1, function (d) {
					assertEquals(this.callbackSource, buffer);
					assertEquals(this.callbackMessage, undefined);
					assertEquals(this.callbackData, 'abcde');
					assertEquals(d, undefined);
					this.count ++;  // 5
					assertEquals(buffer.available, 0);
					assertEquals(buffer.getQueue.size(), 0);
					assertEquals(buffer.putQueue.size(), 0);
				})
				.setData('abcde');
			});
			
			this.setTimer(60).done(function () {
				assertEquals(buffer.available, 0);
				this.putBuffer(buffer, 1000)
				.done(function () { assertFail();})
				.waitUntil(1, function (d) {
					assertEquals(this.callbackSource, buffer);
					assertEquals(this.callbackMessage, undefined);
					assertEquals(this.callbackData, 'abcde');
					assertEquals(d, undefined);
					this.count ++;  // 6
					assertEquals(buffer.available, 0);
				})
				.setData('abcde');
			});
			
			// put and get requests are bailed out on event
			this.setTimer(70).done(function () {
				assertEquals(buffer.available, 0);
				event.clear();
				this.getBuffer(buffer, 10)
				.done(function () { assertFail();})
				.unlessEvent(event, function (d) {
					assertEquals(this.callbackSource, buffer);
					assertEquals(this.callbackMessage, event);
					assertEquals(this.callbackData, 'abcde');
					assertEquals(d, undefined);
					this.count ++;  // 7
					assertEquals(this.time(), 71);
					assertEquals(buffer.available, 0);
				})
				.setData('abcde');
			});
			this.setTimer(71).done(function() {event.fire();});
			
			this.setTimer(80).done(function () {
				assertEquals(buffer.available, 0);
				event.clear();
				this.putBuffer(buffer, 1000)
				.done(function () { assertFail();})
				.unlessEvent(event, function (d) {
					assertEquals(this.callbackSource, buffer);
					assertEquals(this.callbackMessage, event);
					assertEquals(this.callbackData, 'abcde');
					assertEquals(d, undefined);
					this.count ++;  // 8
					assertEquals(this.time(), 81);
					assertEquals(buffer.available, 0);
				})
				.setData('abcde');
			});
			this.setTimer(81).done(event.fire, event);
			
			// put request is satisfied later by get
			this.setTimer(90).done(function() {
				assertEquals(buffer.available, 0);
				this.putBuffer(buffer, 80);
				assertEquals(buffer.available, 80);
			});
			this.setTimer(91).done(function() {
				assertEquals(buffer.available, 80);
				this.putBuffer(buffer, 50)
				.done(function (d) {
					assertEquals(this.callbackSource, buffer);
					assertEquals(this.callbackMessage, undefined);
					assertEquals(this.callbackData, '1234');
					assertEquals(d, undefined);
					this.count ++;
					assertEquals(this.time(), 92);
					this.getBuffer(buffer, 50);
				}, this)	
				.setData('1234');
			});
			this.setTimer(92).done(function () {
				assertEquals(buffer.available, 80);
				this.getBuffer(buffer, 80); 
			});
			
			// get request is satisfied later by put
			this.setTimer(100).done(function() {
				assertEquals(buffer.available, 0);
				this.getBuffer(buffer, 50)
				.done(function (d) {
					assertEquals(this.callbackSource, buffer);
					assertEquals(this.callbackMessage, undefined);
					assertEquals(this.callbackData, '4321');
					assertEquals(d, undefined);
					this.count ++;
					assertEquals(this.time(), 101);
				})	
				.setData('4321');
			});
			this.setTimer(101).done(this.putBuffer, this, [buffer, 50]);
			
		},
		finalize: function () {
			finalized ++;
			assertEquals(buffer.available, 0);
			assertEquals(this.count, 10);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(300);
	entities ++;
};


function testRequestEvents() {
	var sim = new Sim();
	var event1 = new Sim.Event('event1');
	var event2 = new Sim.Event('event2');

	var Entity = {
		count: 0,
		start: function () {
			this.setTimer(10)
			.done(assertFail)
			.unlessEvent([event1, event2], function () {
				assertEquals(this.callbackSource, undefined);
				assertEquals(this.callbackMessage, event1);
				assertEquals(this.callbackData, undefined);
				this.count ++;
			});
			
			
			this.setTimer(15).done(function () {
				this.waitEvent(event1).done(assertFail)
				.unlessEvent(event2, function (d) {
					assertEquals(this.callbackSource, event1);
					assertEquals(this.callbackMessage, event2);
					assertEquals(this.callbackData, 'abcd');
					assertEquals(d, 101);
					this.count ++;
				}, this, 101)
				.setData('abcd');
			});
			
		this.setTimer(5).done(event1.fire, event1);
		this.setTimer(20).done(event2.fire, event2);
			
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 2);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

function testRequestEventRepeat() {
	var sim = new Sim();
	var event1 = new Sim.Event('event1');
	var event2 = new Sim.Event('event2');

	var Entity = {
		count: 0,
		start: function () {
			this.setTimer(10)
			.done(assertFail)
			.unlessEvent([event1, event2], this.inc)
			.unlessEvent([event1, event2], this.inc);
			
			
		this.setTimer(5).done(event1.fire, event1);
		},
		inc: function() { this.count++; },
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 1);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}


function testRequestCancel() {
	var sim = new Sim();
	var event = new Sim.Event('event1');
	var fac = new Sim.Facility('facility');
	var buffer = new Sim.Buffer('a', 100);

	var Entity = {
		count: 0,
		start: function () {
			var ro1 = this.setTimer(50)
				.done(assertFail)
				.waitUntil(20, assertFail)
				.unlessEvent(event, assertFail);
			
			var ro2 = this.waitEvent(event)
			.done(assertFail)
			.waitUntil(20, assertFail)
			.unlessEvent(event, assertFail);
			
			var ro3 = this.putBuffer(buffer, 110)
			.done(assertFail)
			.waitUntil(20, assertFail)
			.unlessEvent(event, assertFail);
			
			
			this.useFacility(fac, 20);
			
			var ro4 = this.useFacility(fac, 10)
			.done(assertFail)
			.waitUntil(20, assertFail)
			.unlessEvent(event, assertFail);
			
			var ro5 = this.getBuffer(buffer, 110)
			.done(assertFail)
			.waitUntil(20, assertFail)
			.unlessEvent(event, assertFail);
			
			this.setTimer(10).done(ro1.cancel, ro1);
			this.setTimer(10).done(ro2.cancel, ro2);
			this.setTimer(10).done(ro3.cancel, ro3);
			this.setTimer(10).done(ro4.cancel, ro4);
			this.setTimer(10).done(ro5.cancel, ro5);
		},
		finalize: function () {
			finalized ++;
			assertEquals(this.count, 0);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities ++;
}

// unlessEvent(e1).unlessEvent(e1)
// unlessEvent([e1, e1])