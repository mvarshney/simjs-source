if (this.load) {

	console = {
			log: function(str) {
				print(str + "\n");
			},
			trace: function () {
				try {
					var a = undefined;
					a.toString();
				} catch (e) {
					e.rhinoException.printStackTrace();
				}
			}
	};

	document = {
			write: function (str) {
				print(str + "\n");
			}
	};

	load('../src/sim.js');
	load('../src/random.js');
	load('../src/queues.js');
	load('../src/stats.js');
	load('../src/request.js');
	load('tester.js');
	load('store-tests.js');
	load('pqueue-tests.js');
	load('sim-tests.js');
	load('message-tests.js');
	load('request-tests.js');
	load('buffer-tests.js');
	load('timer-tests.js');
	load('event-tests.js');
	load('facility-tests.js');
	load('queue-tests.js');
	load('stats-tests.js');
	load('random-tests.js');
}

var entities = 0;
var finalized = 0;


function setUp() {
	entities = 0;
	finalized = 0;
}

function tearDown() {
	assertEquals(entities, finalized);
}


runTests();
