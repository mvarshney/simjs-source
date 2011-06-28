function testMessageSendOne() {
	var sim = new Sim();
	var count = 0;
	
	var Entity = {
		start: function () {
			if (this.master) {
				this.send("message", 10, this.other);
			}
		},
		onMessage: function (source, message) {
			assertEquals(source, this.other);
			assertEquals(message, "message");
			assertEquals(this.time(), 10);
			assertEquals(this.master, undefined);
			count ++;
		},

		finalize: function () {
			finalized ++;
		}
	};

	var o1 = sim.addEntity(Entity);
	var o2 = sim.addEntity(Entity);
	o1.master = true;
	o1.other = o2;
	o2.other = o1;
	sim.simulate(100);
	entities = 2;
	assertEquals(count, 1);
}

function testMessageSendAll() {
	var sim = new Sim();
	var count = 0;
	
	var Entity = {
		start: function () {
			if (this.master) {
				this.send("message", 10);
			}
		},
		onMessage: function (source, message) {
			assertEquals(source, this.other);
			assertEquals(message, "message");
			assertEquals(this.time(), 10);
			assertEquals(this.master, undefined);
			count ++;
		},

		finalize: function () {
			finalized ++;
		}
	};

	var o1 = sim.addEntity(Entity);
	var o2 = sim.addEntity(Entity);
	var o3 = sim.addEntity(Entity);
	o1.master = true;
	o2.other = o1;
	o3.other = o1;
	
	sim.simulate(100);
	entities = 3;
	assertEquals(count, 2);
}

function testMessageSendArray() {
	var sim = new Sim();
	var count = 0;
	
	var Entity = {
		start: function () {
			if (this.master) {
				this.send("message", 10, this.array);
			}
		},
		onMessage: function (source, message) {
			assertEquals(source, this.other);
			assertEquals(message, "message");
			assertEquals(this.time(), 10);
			assertEquals(this.master, undefined);
			count ++;
		},

		finalize: function () {
			finalized ++;
		}
	};

	var o1 = sim.addEntity(Entity);
	var o2 = sim.addEntity(Entity);
	var o3 = sim.addEntity(Entity);
	o1.master = true;
	o1.array = [o2, o3, o1];
	o2.other = o1;
	o3.other = o1;
	
	sim.simulate(100);
	entities = 3;
	assertEquals(count, 2);
}

function testMessageNoCallback() {
	var sim = new Sim();
	var count = 0;
	
	var Entity = {
		start: function () {
			if (this.master) {
				this.send("message", 10, this.other);
			}
		},
	
		finalize: function () {
			finalized ++;
		}
	};

	var o1 = sim.addEntity(Entity);
	var o2 = sim.addEntity(Entity);
	o1.master = true;
	o1.other = o2;
	o2.other = o1;
	sim.simulate(100);
	entities = 2;
	assertEquals(sim.time(), 10);
}

function testMessageDelayedSendOne() {
	var sim = new Sim();
	var count = 0;
	
	var Entity = {
		start: function () {
			if (this.master) {
				this.setTimer(10).done(this.send, this, ["message", 10, this.other]);
			}
		},
		onMessage: function (source, message) {
			assertEquals(source, this.other);
			assertEquals(message, "message");
			assertEquals(this.time(), 20);
			assertEquals(this.master, undefined);
			count ++;
		},

		finalize: function () {
			finalized ++;
		}
	};

	var o1 = sim.addEntity(Entity);
	var o2 = sim.addEntity(Entity);
	o1.master = true;
	o1.other = o2;
	o2.other = o1;
	sim.simulate(100);
	entities = 2;
	assertEquals(count, 1);
}

function testMessageZeroDelay() {
	var sim = new Sim();
	var count = 0;
	
	var Entity = {
		start: function () {
			if (this.master) {
				this.setTimer(10).done(this.send, this, ["message", 0, this.other]);
			}
		},
		onMessage: function (source, message) {
			assertEquals(source, this.other);
			assertEquals(message, "message");
			assertEquals(this.time(), 10);
			assertEquals(this.master, undefined);
			count ++;
		},

		finalize: function () {
			finalized ++;
		}
	};

	var o1 = sim.addEntity(Entity);
	var o2 = sim.addEntity(Entity);
	o1.master = true;
	o1.other = o2;
	o2.other = o1;
	sim.simulate(100);
	entities = 2;
	assertEquals(count, 1);
}