## 

rm queuing.js

cat ../../src/sim.js | grep -v ARG_CHECK >> queuing.js
cat ../../src/request.js| grep -v ARG_CHECK  >> queuing.js
cat ../../src/queues.js | grep -v ARG_CHECK >> queuing.js
cat ../../src/stats.js | grep -v ARG_CHECK >> queuing.js
cat ../../src/random.js | grep -v ARG_CHECK >> queuing.js


cat ../src/image_view.js >> queuing.js
cat ../src/monitor_model.js >> queuing.js
cat ../src/queue_app.js >> queuing.js
cat ../src/server_model.js >> queuing.js
cat ../src/source_model.js >> queuing.js
cat ../src/sink_model.js >> queuing.js
cat ../src/splitter_model.js >> queuing.js
cat ../src/splitter_view.js >> queuing.js

java -jar compiler.jar --js queuing.js --js_output_file queuing-min.js

