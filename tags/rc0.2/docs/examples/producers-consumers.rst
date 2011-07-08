**The Producer-Consumer Problem**: There are *nProducers* number of producer entities that produce tokens at rate of *productionRate* and stores them in a common buffer of *bufferSize* capacity. The producers must successfully store their produced items in buffer before they can begin on production of the next item. There are also *nConsumers* number of consumer entities that retrieve tokens from the same buffer and process them at rate of *consumerRate*.

We would like to study what is the average wait times for the producers and the consumers, given different values of the various parameters (such as *bufferSize*, *productionRate* etc).

We create the common buffer as:

.. code-block:: js
    
    var buffer = new Sim.Buffer("buffer", bufferSize);

We model the producers as entities that generate one token every *t* seconds, where *t* is exponential random number will mean *productionRate*.

.. code-block:: js

    Random rand = new Random(SEED);
    
    var Producer = {
        start: function () {
            var timeToProduce = rand.exponential(1.0 / productionRate);
            
            // Set timer to self (models the time spend in production)
            this.setTimer(timeToProduce).done(function () {
                // Timer expires => item is ready to be stored in buffer.
                // When the item is successfully stored in buffer, we repeat
                //     the process by recursively calling the same function.
                this.putBuffer(buffer, 1).done(this.start);
            });
        }
    }

We model the consumers as entities that retrieve tokens from the buffers, and process them for *t* seconds, where *t* is exponential random number will mean *consumptionRate*.

.. code-block:: js

    var Consumer = {
        start: function () {
            // Retrieve one token from buffer
            this.getBuffer(buffer, 1).done(function () {
                // After an item has been retrieved, wait for some time
                //   to model the consumption time.
                // After the waiting period is over, we repeat by
                //   recursively calling this same function.
                var timeToConsume = rand.exponential(1.0 / consumptionRate);
                
                this.setTimer(timeToConsume).done(this.start);
            });
        }
    }


Finally we create the simulation and entity objects, and start the simulation.

.. code-block:: js

    // Create simulator
    var sim = new Simulator("Producer Consumer Problem");
    
    // Create producer entities
    for (var i = 0; i < nProducers; i++) sim.addEntity(Producer);

    // Create consumer entities
    for (var i = 0; i < nConsumers; i++) sim.addEntity(Consumer);
    
    // Start simulation
    sim.simulate(SIMTIME);
    
    // statistics
    buffer.report();
