
function testFacilityFCFSOneServer() {
	var sim = new Sim();
	var fac = new Sim.Facility('facility', Sim.FCFS, 1);
	
	var Entity = {
		count: 0,
		start: function () {
			// at time 0 => [0, 10]
			// at time 0 => [10, 20]
			// at time 4 => [20, 30]
			// at time 40 => [40, 50]
			this.useFacility(fac, 10).done(function () {
				assertEquals(this.time(), 10);
				assertEquals(this.callbackSource, fac);
				assertEquals(this.callbackMessage, 0);
				this.count ++;
			});
			
			this.useFacility(fac, 10).done(function () {
				assertEquals(this.time(), 20);
				assertEquals(this.callbackSource, fac);
				assertEquals(this.callbackMessage, 0);
				this.count ++;
			});
			
			this.setTimer(4).done(function () {
				this.useFacility(fac, 10).done(function () {
					assertEquals(this.time(), 30);
					assertEquals(this.callbackSource, fac);
					assertEquals(this.callbackMessage, 0);
					this.count ++;
				});	
			});
			
			this.setTimer(40).done(function () {
				this.useFacility(fac, 10).done(function () {
					assertEquals(this.time(), 50);
					assertEquals(this.callbackSource, fac);
					assertEquals(this.callbackMessage, 0);
					this.count ++;
				});	
			});
			
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 50);
			assertEquals(this.count, 4);
			assertEquals(fac.usage(), 40);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testFacilityFCFSOOneServerTwoEntities() {
	var sim = new Sim();
	var fac = new Sim.Facility('facility');
	
	var Entity = {
		count: 0,
		start: function () {
			// entity 1, at time 0: [0, 10]
			// entity 2, at time 0: [10, 20]
			// entity 1, at time 4: [20, 30]
			// entity 2, at time 4: [30, 40]
			// entity 1, at time 50: [50, 60]
			// entity 2, at time 70: [70, 80]
			if (this.first) {
				this.useFacility(fac, 10).done(function () {
					assertEquals(this.time(), 10);
					this.count ++;
				});
				this.setTimer(4).done(function () {
					this.useFacility(fac, 10).done(function () {
						assertEquals(this.time(), 30);
						this.count ++;
					});	
				});
				this.setTimer(50).done(function () {
					this.useFacility(fac, 10).done(function () {
						assertEquals(this.time(), 60);
						this.count ++;
					});	
				});
				
			} else {
				this.useFacility(fac, 10).done(function () {
					assertEquals(this.time(), 20);
					this.count ++;
				});
				
				this.setTimer(4).done(function () {
					this.useFacility(fac, 10).done(function () {
						assertEquals(this.time(), 40);
						this.count ++;
					});	
				});
				
				this.setTimer(70).done(function () {
					this.useFacility(fac, 10).done(function () {
						assertEquals(this.time(), 80);
						this.count ++;
					});	
				});
			}
			
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 80);
			assertEquals(this.count, 3);
		}
	};

	sim.addEntity(Entity).first = true;
	sim.addEntity(Entity).first = false;
	sim.simulate(100);
	entities = 2;
}

function testFacilityFCFSTwoServers() {
	var sim = new Sim();
	var fac = new Sim.Facility('facility', Sim.FCFS, 2);
	
	var Entity = {
		count: 0,
		start: function () {
			// at time 0: [0, 10] at server 0
			// at time 0: [0, 10] at server 1
			// at time 0: [10, 20] at server 0
			// at time 14: [14, 24] at server 1
			this.useFacility(fac, 10).done(function (s, m) {
				assertEquals(this.time(), 10);
				assertEquals(this.callbackSource, fac);
				assertEquals(this.callbackMessage, 0);
				this.count ++;
			});
			
			this.useFacility(fac, 10).done(function (s, m) {
				assertEquals(this.time(), 10);
				assertEquals(this.callbackSource, fac);
				assertEquals(this.callbackMessage, 1);
				this.count ++;
			});
			
			this.useFacility(fac, 10).done(function (s, m) {
				assertEquals(this.time(), 20);
				assertEquals(this.callbackSource, fac);
				assertEquals(this.callbackMessage, 0);
				this.count ++;
			});
			
			this.setTimer(14).done(function () {
				this.useFacility(fac, 10).done(function (s, m) {
					assertEquals(this.time(), 24);
					assertEquals(this.callbackSource, fac);
					assertEquals(this.callbackMessage, 1);
					this.count ++;
				});	
			});
			
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 24);
			assertEquals(this.count, 4);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testFacilityLCFSSimple() {
	var sim = new Sim();
	var fac = new Sim.Facility('lcfs', Sim.Facility.LCFS);
	
	var Entity = {
		count: 0,
		start: function () {
			this.useFacility(fac, 10).done(function () {
				assertEquals(this.time(), 20);
				this.count ++;
			});
		
			this.setTimer(4).done(function () {
				this.useFacility(fac, 10).done(function () {
					assertEquals(this.time(), 14);
					this.count ++;
				});	
			});
				
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 20);
			assertEquals(this.count, 2);
			assertEquals(fac.usage(), 20);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testFacilityLCFSPreemptTwice() {
	var sim = new Sim();
	var fac = new Sim.Facility('lcfs', Sim.Facility.LCFS);
	
	var Entity = {
		count: 0,
		start: function () {
			this.useFacility(fac, 10).done(function () {
				assertEquals(this.time(), 30);
				this.count ++;
			});
		
			this.setTimer(4).done(function () {
				this.useFacility(fac, 10).done(function () {
					assertEquals(this.time(), 14);
					this.count ++;
				});	
			});
			
			this.setTimer(16).done(function () {
				this.useFacility(fac, 10).done(function () {
					assertEquals(this.time(), 26);
					this.count ++;
				});	
			});
				
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 30);
			assertEquals(this.count, 3);
			assertEquals(fac.usage(), 30);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testFacilityLCFSPreemptTwoLevel() {
	var sim = new Sim();
	var fac = new Sim.Facility('lcfs', Sim.Facility.LCFS);
	
	var Entity = {
		count: 0,
		start: function () {
			this.useFacility(fac, 10).done(function () {
				assertEquals(this.time(), 30);
				this.count ++;
			});
		
			this.setTimer(4).done(function () {
				this.useFacility(fac, 10).done(function () {
					assertEquals(this.time(), 24);
					this.count ++;
				});	
			});
			
			this.setTimer(6).done(function () {
				this.useFacility(fac, 10).done(function () {
					assertEquals(this.time(), 16);
					this.count ++;
				});	
			});
				
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 30);
			assertEquals(this.count, 3);
			assertEquals(fac.usage(), 30);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testFacilityTimeoutDuringUsage() {
	var sim = new Sim();
	var fac = new Sim.Facility('simple', Sim.Facility.FCFS);
	
	var Entity = {
		count: 0,
		start: function () {
			this.useFacility(fac, 10).done(function () {
				assertEquals(this.time(), 10);
				this.count ++;
			});
		
			this.setTimer(4).done(function () {
				this.useFacility(fac, 10).done(function () {
					assertFail();
				})
				.waitUntil(4, function () {
					assertEquals(this.time(), 8);
					this.count ++;
				});	
			});

			this.setTimer(6).done(function () {
				this.useFacility(fac, 10).done(function () {
					assertEquals(this.time(), 20);
					this.count ++;
				})
				.waitUntil(5, function () {
					assertFail();
				});	
			});
				
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 20);
			assertEquals(this.count, 3);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testFacilityCancelDuringUsage() {
	var sim = new Sim();
	var fac = new Sim.Facility('simple', Sim.Facility.FCFS);
	
	var Entity = {
		count: 0,
		start: function () {
			this.ro = this.useFacility(fac, 10).done(function () {
				assertEquals(this.time(), 10);
				this.count ++;
			});
			
			this.ro2 = this.useFacility(fac, 10).done(assertFail);
			this.setTimer(2).done(this.ro2.cancel, this.ro2);
			
			this.useFacility(fac, 10).done(function () {
				assertEquals(this.time(), 20);
				this.count ++;
			});
		
			this.setTimer(4).done(function () {
				this.ro.cancel();
			});
									
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 20);
			assertEquals(this.count, 2);
			assertEquals(fac.usage(), 20);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}

function testFacilityLCFSImmuneToRenege() {
	var sim = new Sim();
	var fac = new Sim.Facility('simple', Sim.Facility.LCFS);
	var event = new Sim.Event('a');
	
	var Entity = {
		count: 0,
		start: function () {
			this.ro = this.useFacility(fac, 10)
			.done(function () {
				assertEquals(this.time(), 10);
				this.count ++;
			})
			.waitUntil(1, assertFail)
			.unlessEvent(event, assertFail);
			
			event.fire(true);
		
			this.setTimer(4).done(function () {
				this.ro.cancel();
			});
									
		},
		finalize: function () {
			finalized++;
			assertEquals(this.time(), 10);
			assertEquals(this.count, 1);
			assertEquals(fac.usage(), 10);
		}
	};

	sim.addEntity(Entity);
	sim.simulate(100);
	entities = 1;
}
