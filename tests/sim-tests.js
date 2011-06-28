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