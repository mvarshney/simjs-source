=========================================
Resources: Facilities and Buffers
=========================================


.. _resources-facility:

Facility
==========

*Facility* is a resource that is used by entities for a finite duration. There is a limit on the number of entities that can use the facility at a given time. As an example, consider a barbershop (the facility) with *m* barbers (capacity of facility). The customers arrive at shop and wish to 'use' the resource (barber); if all barbers are busy, the customers wait until one barber is available.

The timeline of interactions between entities and facility is as follows:

1. An entity requests the simulator to use a facility for *duration* time (with :func:`useFacility` ``Entity Prototype`` API).
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

*Round Robin (RR)*
    All entities take turn to use the facility for some time quanta duration each.

*Processor Sharing (PS)*
    There is no queue in the system. All entities simultaneously use the facility, however their usage duration increases proportionally to the number of active entities.
    
In the version |version| only FCFS and LCFS scheduling disciplines are supported. The other disciplines are planned for future releases.

Entities access the buffers through their ``Entity Prototype`` API:

* :attr:`useFacility(facility, duration)`. Request to use the *facility* for *duration* time. This returns a :ref:`Request <request-main>` object.

API Reference
--------------

.. js:class:: Sim.Facility(name, [discipline[, numServers]])
    
    Creates a new facility. ``name`` (string) is used for identifying the statistics in a report. ``discipline`` is the scheduling discipline; currently it can take one of these values:
    
    * Sim.Facility.FCFS (first come first served) [Default value]
    * Sim.Facility.LCFS (last come first served)
    
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


.. _resources-buffer:

Buffer
========

*Buffer* is a resource that can store a finite number of tokens. Any entity can store tokens in the buffer if there is free space, or retrieve existing tokens from the buffer if some are available. Queueing happens when:

* an entity wishes to store tokens, but the buffer does not have sufficient free space to store them. The entity will be queued until some other entity (or entities) remove tokens from the buffer to create enough free space.
* an entity wishes to retrieve tokens, but the buffer does not have sufficient number of available tokens. The entity will be queued until some other entity (or entities) put enough number tokens into the buffer.

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
    
The :class:`~!Sim.Buffer` class does not directly provide any *put()* or *get()* API. Instead, entities must use their ``Entity Prototype`` functions (:func:`putBuffer` and :func:`getBuffer`) to access buffers.

Example: Producers-Consumers
-----------------------------

.. include:: examples/producers-consumers.rst