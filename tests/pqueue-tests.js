function testPqueue () {
	function printpq(arr) {
		for (var i = 0; i < arr.length; i ++) {
			print(arr[i].deliverAt + ", ");
		}
		print ("\n");
	}
	
	function assertArrays(a, b) {
		assertEquals(a.length, b.length);

		for (var i = 0; i < a.length; i ++) {
			assertEquals(a[i], b[i]);
		}
	}
	
	var dataset = [[],
	               [0],
	               [1],
	               [1, 2],
	               [2, 1],
	               [1, 2, 3],
	               [3, 2, 1],
	               [3, 1, 2],
	               [1, 2, 3, 4],
	               [4, 3, 1, 2],
	               [1, 1, 1, 1],
	               [1, 1, 3, 1, 1],
	               [9, 8, 7, 6, 5, 4, 3, 2, 1],
	               [9, 8, 7, 6, 5, 4, 3, 2, 1, 10]];
	
	for (var i = 0; i < dataset.length; i ++) {
		var arr = dataset[i];
		// insert
		var pq = new Sim.PQueue();
		for (var j = 0; j < arr.length; j++) {
			pq.insert(new Sim.Request(0, 0, arr[j]));
		}
		
		var out = [];
		while (true) {
			var a = pq.remove();
			if (a === undefined) break;
			out.push(a.deliverAt);
		}
		
		assertArrays(arr.sort(function (a, b) { return a - b;}), out);
		
	}
}