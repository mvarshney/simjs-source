function testSimExtendedPrototype() {
	var sim = new Sim();
	
	var Entity = {
		start: function () {}
	};
	
	assertEquals(Entity.time, undefined);
	var obj = sim.addEntity(Entity);
	assertEquals(Entity.time instanceof Function, true);
	assertEquals(obj.time instanceof Function, true);

}

function testStartArguments () {
	var sim = new Sim();
	
	var Entity = {
		start: function (a, b) {
			assertEquals(a, 10),
			assertEquals(b.a, 20);
		}
	};
	
	sim.addEntity(Entity, 10, {a: 20});
	sim.simulate(100);
}