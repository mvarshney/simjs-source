## 
VERSION=0.25

## Clean up
rm -f sim-$VERSION-debug.js
rm -f sim-$VERSION.js
rm -f random-$VERSION-debug.js
rm -f random-$VERSION.js

## Create the debug versions
cat ../src/sim.js >> sim-$VERSION-debug.js
cat ../src/request.js >> sim-$VERSION-debug.js
cat ../src/queues.js >> sim-$VERSION-debug.js
cat ../src/stats.js >> sim-$VERSION-debug.js
cat ../src/random.js >> sim-$VERSION-debug.js

cat ../src/random.js >> random-$VERSION-debug.js


## The debug library passes the unit tests
function run_test {
	TESTFILE=test.js
	TESTS=`ls ../tests/*-tests.js`
	> $TESTFILE
	echo "load('$1');"  >> $TESTFILE
	echo "load('../tests/tester.js');"  >> $TESTFILE
	echo "document = {
	        write: function (str) {
	            print(str + '\n');
	        }
	};
	" >> $TESTFILE

	for test in $TESTS
	do
		echo "load('$test');" >> $TESTFILE
	done
	echo "var entities = 0;
	var finalized = 0;


	function setUp() {
	    entities = 0;
	    finalized = 0;
	}

	function tearDown() {
	    assertEquals(entities, finalized);
	}

	runTests();
	" >> $TESTFILE

	jrunscript $TESTFILE
}

run_test sim-$VERSION-debug.js

## Remove some code
cat sim-$VERSION-debug.js | grep -v "ARG_CHECK" > sim-$VERSION-tmp.js
cat random-$VERSION-debug.js | grep -v "ARG_CHECK" > random-$VERSION-tmp.js

## Minify
java -jar compiler.jar --js sim-$VERSION-tmp.js --js_output_file sim-$VERSION.js
java -jar compiler.jar --js random-$VERSION-tmp.js --js_output_file random-$VERSION.js

rm sim-$VERSION-tmp.js
rm random-$VERSION-tmp.js

## regression test the release version
run_test sim-$VERSION.js

rm test.js
