## 

rm -rf queuing
rm -f queuing.js
rm -f queuing-offline.js

cat ../../src/sim.js | grep -v ARG_CHECK >> queuing.js
cat ../../src/request.js| grep -v ARG_CHECK  >> queuing.js
cat ../../src/queues.js | grep -v ARG_CHECK >> queuing.js
cat ../../src/stats.js | grep -v ARG_CHECK >> queuing.js
cat ../../src/random.js | grep -v ARG_CHECK >> queuing.js


cat ../src/image_view.js >> queuing.js
cat ../src/queue_app.js >> queuing.js
cat ../src/server_model.js >> queuing.js
cat ../src/source_model.js >> queuing.js
cat ../src/sink_model.js >> queuing.js
cat ../src/splitter_model.js >> queuing.js
cat ../src/splitter_view.js >> queuing.js
cat ../src/models.js >> queuing.js

java -jar compiler.jar --js queuing.js --js_output_file queuing-min.js


#cat ../../src/sim.js | grep -v ARG_CHECK >> queuing-offline.js
#cat ../../src/request.js| grep -v ARG_CHECK  >> queuing-offline.js
#cat ../../src/queues.js | grep -v ARG_CHECK >> queuing-offline.js
#cat ../../src/stats.js | grep -v ARG_CHECK >> queuing-offline.js
#cat ../../src/random.js | grep -v ARG_CHECK >> queuing-offline.js
#
#cat ../src/queue-offline.js >> queuing-offline.js
#java -jar compiler.jar --js queuing-offline.js --js_output_file queuing-offline-min.js

# create directories
mkdir queuing
mkdir queuing/css
mkdir queuing/css/images
mkdir queuing/lib
mkdir queuing/images

# copy html
cp ../index.html queuing

# copy javascripts
cp queuing-min.js queuing
cp ../lib/raphael-min.js queuing/lib

# copy css
java -jar yuicompressor-2.4.6.jar --type css ../css/jquery-ui-1.8.16.custom.css > queuing/css/jquery-ui-1.8.16.custom.css
java -jar yuicompressor-2.4.6.jar --type css ../css/queuing.css > queuing/css/queuing.css

# copy images
cp ../images/background.gif queuing/images
cp ../images/banner.png queuing/images
cp ../images/customers.png queuing/images
cp ../images/door_out.png queuing/images
cp ../images/odometer.png queuing/images
cp ../images/orange-arrow.gif queuing/images
cp ../images/server.png queuing/images
cp ../images/settings.gif queuing/images
cp ../images/splitter.png queuing/images

cp ../css/images/ui-bg_diagonals-thick_18_b81900_40x40.png queuing/css/images
cp ../css/images/ui-bg_diagonals-thick_20_666666_40x40.png queuing/css/images
cp ../css/images/ui-bg_flat_10_000000_40x100.png queuing/css/images
cp ../css/images/ui-bg_glass_100_f6f6f6_1x400.png queuing/css/images
cp ../css/images/ui-bg_glass_100_fdf5ce_1x400.png queuing/css/images
cp ../css/images/ui-bg_glass_65_ffffff_1x400.png queuing/css/images
cp ../css/images/ui-bg_gloss-wave_35_f6a828_500x100.png queuing/css/images
cp ../css/images/ui-bg_highlight-soft_100_eeeeee_1x100.png queuing/css/images
cp ../css/images/ui-bg_highlight-soft_75_ffe45c_1x100.png queuing/css/images
cp ../css/images/ui-icons_222222_256x240.png queuing/css/images
cp ../css/images/ui-icons_228ef1_256x240.png queuing/css/images
cp ../css/images/ui-icons_ef8c08_256x240.png queuing/css/images
cp ../css/images/ui-icons_ffd27a_256x240.png queuing/css/images
cp ../css/images/ui-icons_ffffff_256x240.png queuing/css/images

