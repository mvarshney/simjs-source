==========================================
Resources: Facilities, Buffers and Stores
==========================================


.. _resources-facility:

Facility
==========

*Facility* is a resource that is used by entities for a finite duration. There is a limit on the number of entities that can use the facility at a given time. As an example, consider a barbershop (the facility) with *m* barbers (capacity of facility). The customers arrive at shop and wish to 'use' the resource (barber); if all barbers are busy, the customers wait until one barber is available.

The timeline of interactions between entities and facility is as follows:

1. An entity requests the simulator to use a facility for *duration* time (with :func:`useFacility` ``Extended Entity Prototype`` API).
2. If the facility is busy, the entity is placed in facility's queue. It waits there until other entities in front of it are done using the facility (also see the *Scheduling Disciplines* below).
3. If the facility is free or when the entity is done waiting in the queue, the entity is given access to the facility. This is modeled as:
    * The facility is marked as busy.
    * The simulator starts a timer for *duration* interval.
4. At the expiration of the timer, the entity is notified that it has just finished using the facility.

.. note:: The entity is notified only at the completion of the request (step 4 above). 
    
    It is not notified, for example, when it done waiting in the queue or when it is preempted (if supported by queuing discipline).

.. note:: The :func:`useFacility` request can only be cancelled or reneged while the entity is waiting in queue.

    If the entity has started using the facility (step 3 above), the entity cannot be removed from the queue. That is, :func:`Sim.Request.cancel`, :func:`Sim.Request.waitUntil` and :func:`Sim.Request.unlessEvent` will have no effect after the entity has started using facility. 

**Scheduling Disciplines**

Scheduling Discipline is the policy on how the entities wait in the queue and use the facility. Some disciplines are:

*First Come First Server (FCFS)*
    This is the most common scheduling discipline. Entities queue up in priority of their arrival times. Only when an entity is done using the facility, the next earliest entity is scheduled.
    
*Last Come First Served (LCFS)*
    The last entity arriving at facility will preempt any current entity. When this entity is finished, the earlier entities will resume.


*Processor Sharing (PS)*
    There is no queue in the system. All entities simultaneously use the facility, however their usage duration increases proportionally to the number of active entities.

*Round Robin (RR)* (not supported)
    All entities take turn to use the facility for some time quanta duration each.
    
In the version |version| only FCFS, LCFS and Processor Sharing scheduling disciplines are supported. The other disciplines are planned for future releases.

Entities access the buffers through their ``Entity Prototype`` API:

* :attr:`useFacility(facility, duration)`. Request to use the *facility* for *duration* time. This returns a :ref:`Request <request-main>` object.

API Reference
--------------

.. js:class:: Sim.Facility(name, [discipline[, numServers]])
    
    Creates a new facility. ``name`` (string) is used for identifying the statistics in a report. ``discipline`` is the scheduling discipline; currently it can take one of these values:
    
    * Sim.Facility.FCFS (first come first served) [Default value]
    * Sim.Facility.LCFS (last come first served)
    * Sim.Facility.PS (processor sharing; resources are "shared", see :ref:`resource-processor-sharing`)
    
    ``numServers`` is the number of servers available in the facility. By default, only one server is available per facility. Currently, only Sim.Facility.FCFS uses this parameter.

.. js:function:: Sim.Facility.usage()
    
    Return the duration for which this facility has been in use.

.. js:function:: Sim.Facility.systemStats()
    
    Return :ref:`Population <statistics-population>` statistics for the request in the system (queue + service time).

.. js:function:: Sim.Facility.queueStats()

    Return :ref:`Population <statistics-population>` statistics for the request in the queue.

Example: M/M/c Queue
----------------------
**The M/M/c problem**: There are *c* servers (e.g. bank tellers) whose services are requested by customers. There is only one queue in front of all servers, so a customer at the head of the queue will move if any one of the *c* servers is free. The customers arrival is Poisson process, and service time is exponentially distributed. Such kind of queuing systems and servers can be easily modeled with FCFS facilities.

We create a facility as:

.. code-block:: js
    
    var server = new Sim.Facility('Server', Sim.Facility.FCFS, nServers);

The customers arrive at intervals that is exponentially distributed with mean *lambda*, and they request service for exponentially distributed duration with mean *mu*. We model the customer as:

.. code-block:: js
    
    var rand = new Random(SEED);

    var Customer = {
        start: function () {
            // the next customer will arrive at:
            var nextCustomerInterval = rand.exponential(lamda);
            
            // wait for nextCustomerInterval
            this.setTimer(nextCustomerInterval).done(function () {
                // customer has arrived.
                var useDuration = rand.exponential(mu); // time to use the server
                this.useFacility(server, useDuration);
                
                // repeat for the next customer
                this.start();
            });
        }
    }

Finally we create the simulation and entity objects, and start the simulation.

.. code-block:: js

    var sim = new Sim("M/M/c");  // create simulator
    sim.addEntity(Customer);     // add entity
    sim.simulate(SIMTIME);       // start simulation
    server.report();             // statistics


.. _resource-processor-sharing:

Example: Processor Sharing
------------------------------

In the processor sharing service disciplines, all requesting entities get immediate access to the resource, however, their service time increases proportionally to the number of other entities already in the system.

As an example, consider CPU modeled as facility with Processor Sharing discipline. A single request to use CPU for 1 second will complete in 1 second. Two simultaneous requests to use CPU for 1 second each will finish in 2 seconds each (since the CPU is "shared" between the two requests). 

Another example would be network connection link (e.g. Ethernet) with a given data rate. Entities request to use the resource, which in this case means sending data. If multiple overlapping requests are made then the network link is "shared" between all requests. Say, request one is initiated at time 0 to send data for 10 seconds. A second request is also made at time 5 seconds to send data for 1 second. In this case, the first request will finish at 11 seconds (0 - 5 sec at full capacity, 5 - 7 seconds at half capacity, and 7 - 11 sec at full capacity again), while the second request will finish at 7 seconds . We validate this as follows:

.. code-block:: js

    // create the facility
    var network = new Sim.Facility("Network Cable", Sim.Facility.PS);
    
    var Entity = {
        start: function () {
            // make request at time 0, to use network for 10 sec
            this.useFacility(network, 10).done(function () {
                assert(this.time(), 11);
            });
            
            // make request at time 5, to use the network for 1 sec
            this.setTimer(5).done(function () {
                this.useFacility(network, 1).done(function () {
                    assert(this.time(), 7);
                });
            });
        }
    };
    
    var sim = new Sim();
    sim.addEntity(Entity);
    sim.simulate(100);

.. _resources-buffer:

Buffer
========

*Buffer* is a resource that can store a finite number of tokens. Any entity can store tokens in the buffer if there is free space, or retrieve existing tokens from the buffer if some are available. Queueing happens when:

* an entity wishes to store tokens, but the buffer does not have sufficient free space to store them. The entity will be queued until some other entity (or entities) remove tokens from the buffer to create enough free space.
* an entity wishes to retrieve tokens, but the buffer does not have sufficient number of available tokens. The entity will be queued until some other entity (or entities) put enough number of tokens into the buffer.

.. note:: Buffer vs. Store
    
    Buffers are resources that store "homogeneous" quantities. The buffers do not actually store any object, rather they keep a counter for the current usage, which is increment by *putBuffer* operation and decremented after *getBuffer* operation. If you wish to store real objects, consider using :ref:`resources-store`.

*Buffers* support two basic operations: :func:`~Sim.Buffer.put` to store tokens in the buffer, and :func:`~Sim.Buffer.get` to retrieve tokens from the buffers. The *Buffer* object has two queues: *putQueue* where the entities wait if their :func:`~!Sim.Buffer.put` request cannot be immediately satisfied, and *getQueue* where the entities wait if their :func:`~!Sim.Buffer.get` request cannot be immediately satisfied.

Entities access the buffers through their ``Entity Prototype`` API:

* :attr:`putBuffer(buffer, amount)`. Attempt to store *amount* number of the tokens in *buffer*. This returns a :ref:`Request <request-main>` object.
* :attr:`getBuffer(buffer, amount)`. Attempt to retrieve *amount* number of the tokens from *buffer*. This returns a :ref:`Request <request-main>` object.

API Reference
---------------

.. js:class:: Sim.Buffer(name, maxCapacity[, initialAmount])

    Creates a new buffer. ``name`` (string) is used for identifying the statistics in a report. The buffer has ``maxCapacity`` capacity and has initially ``initialAmount`` number of tokens. If ``initialAmount`` is omitted, then the buffer will be created empty.
    
.. js:function:: Sim.Buffer.size()

    The maximum capacity of the buffer.

.. js:function:: Sim.Buffer.current()
    
    The number of available tokens in the buffer.

.. js:attribute:: Sim.Buffer.putQueue.stats
    
    :ref:`statistics-population` for the put queue.

.. js:attribute:: Sim.Buffer.getQueue.stats

    :ref:`statistics-population` for the get queue.
    
The :class:`~!Sim.Buffer` class does not directly provide any *put()* or *get()* API. Instead, entities must use their ``Entity Prototype`` functions (:func:`putBuffer` and :func:`getBuffer`) to access buffers.

Example: Producers-Consumers
-----------------------------

.. include:: examples/producers-consumers.rst

.. _resources-store:

Store
========

*Store* is a resource that can store a finite number of JavaScript objects (actually any datatype: number, string, function, array, object etc). Any entity can store objects in the store if there is free space, or retrieve existing objects from the store if some are available. Queueing happens when:

* an entity wishes to store objects, but the store does not have sufficient free space to store them. The entity will be queued until some other entity (or entities) remove objects from the store to create enough free space.
* an entity wishes to retrieve objects, but the store does not have sufficient number of available object. The entity will be queued until some other entity (or entities) put enough number of objects into the buffer.

.. note:: Store vs. Buffer
    
    Stores are resources that store distinct JavaScript objects. If you do not wish to store actual objects, consider using :ref:`resources-buffer`.

*Stores* support two basic operations: :func:`~Sim.Store.put` to store objects in the store, and :func:`~Sim.Store.get` to retrieve objects from the stores. The *Store* object has two queues: *putQueue* where the entities wait if their :func:`~!Sim.Store.put` request cannot be immediately satisfied, and *getQueue* where the entities wait if their :func:`~!Sim.Store.get` request cannot be immediately satisfied.

Entities can retrieve objects from stores in two ways:

* Retrieve objects from store in FIFO order.
* Supply a "filter" function and retrieve object that matches the filter.

Entities access the stores through their ``Entity Prototype`` API:

* :attr:`putStore(store, object)`. Attempt to store *object* in *store*. This returns a :ref:`Request <request-main>` object.
* :attr:`getStore(store[, filter])`. Attempt to retrieve object from *buffer*. If the filter function is supplied then the first object (in FIFO order) that matches the filter is retrieved; otherwise the first object in FIFO order is retrieved. This returns a :ref:`Request <request-main>` object.

The retrieved object can be accessed via the :attr:`this.callbackMessage` attribute in the callback function (see example below).

API Reference
---------------

.. js:class:: Sim.Store(name, maxCapacity)

    Creates a new store. ``name`` (string) is used for identifying the statistics in a report. The store has ``maxCapacity`` capacity. The store will be created empty.
    
.. js:function:: Sim.Store.size()

    The maximum capacity of the store.

.. js:function:: Sim.Store.current()
    
    The number of available objects in the store.

.. js:attribute:: Sim.Store.putQueue.stats

    :ref:`statistics-population` for the put queue.

.. js:attribute:: Sim.Store.getQueue.stats

    :ref:`statistics-population` for the get queue.
    
The :class:`~!Sim.Store` class does not directly provide any *put()* or *get()* API. Instead, entities must use their ``Entity Prototype`` functions (:func:`putStore` and :func:`getStore`) to access stores.

Example
----------

.. code-block:: js

    // Create a store
    var store = new Sim.Store("Example Store", 10);
    
    var Entity = {
        start: function () {
            // Put an object
            this.putStore(store, {myfield: "myvalue"});
            // Put another object
            this.putStore(store, {myfield: "othervalue"});
            // arrays, numbers, strings etc can also be stored
            this.putStore(store, "stored string");
            
            // Retrieve object from store.
            // Note 1: If filter function is not supplied, objects are returned in FIFO order
            // Note 2: The object can be accessed via this.callbackMessage
            this.getStore(store).done(function () {
                assert(this.callbackMessage.myfield === "myvalue");
            });
            
            // Retrieve object from store using filter function
            this.getStore(store, function (obj) {
                return (obj === 'stored string');
            })
            .done(function () {
                assert(this.callbackMessage === "stored string");
            });
        }
    }