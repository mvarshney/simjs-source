var alltests = [];

function exposeTestFunctionName(fn) {
	//alltests.push(fn);
}

function fnName(fn) {
	return fn.toString().split(' ')[1];
}

function assertEquals(a, b) {
	if (a !== b) {
		console.log("Error: Values " + a + " and " + b + " are not equal");
		console.trace();
		throw new Error("Stopped on failure");
	}
}

function assertAlmost(a, b, eps) {
	eps = (eps === undefined) ? 1e-7 : eps;
	if (isNaN(a) || isNaN(b) || (Math.abs(a - b) > eps)) {
		console.log("Error: Values " + a + " and " + b + " are not almost equal");
		console.trace();
		throw new Error("Stopped on failure");
	}
}

function assertFail() {
	console.log("Error: Failed");
	console.trace();
	throw new Error("Stopped on failure");
}

/*
function _testfn(fn) {
	return function() {
		console.log("Running " + fnName(fn) + "...");
		try {
			if (setUp) setUp();
			fn();
			if (tearDown) tearDown();
		} catch (e) {
			console.log(e);
			throw e;
		}
	}
}
*/

var global = this;
function runTests() {
	document.write("<pre>");
	for (var i in global) {
		if (i.slice(0, 4) == "test") {
			if (typeof(global[i]) == 'function') {
				alltests.push(global[i]);
			}
		}
	}
	
	document.write("Number of test cases = " + alltests.length);
	for (var i = 0; i < alltests.length; i ++) {
		var fn = alltests[i];
		document.write("Running " + fnName(fn) + "...");
		try {
			if (setUp) setUp();
			fn();
			if (tearDown) tearDown();
		} catch (e) {
			if (e.rhinoException) e.rhinoException.printStackTrace();
			console.log(e);
			document.write('FAILED');
			throw new Error("Testing stopped on error");
		}
	}
	
	document.write("SUCCESS !!");
};
