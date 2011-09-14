//load('../release/queuing-offline-min.js');
load('../../src/sim.js');
load('../../src/request.js');
load('../../src/queues.js');
load('../../src/random.js');
load('../../src/stats.js');
load('../src/queue-offline.js');

var model = '{"until":14400,"seed":1234,"version":"1.0","objects":[{"x":440,"y":88,"type":"sink","name":"sink_1","model":null},{"x":108,"y":70,"type":"source","name":"source_1","out":"queue_1","model":{"lambda":0.25}},{"x":225,"y":66,"type":"queue","name":"queue_1","out":"sink_1","model":{"nservers":1,"mu":1,"infinite":true,"maxqlen":0}}]}';

QueueSimulator(model);
