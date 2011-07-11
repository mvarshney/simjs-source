.. _introduction-simjs:

=========================
Introduction to SIM.JS
=========================

Discrete Event Simulation
===========================


There is a lot to be said on Discrete Event Simulations that can be covered here. We refer the readers to the excellent article at `Wikipedia <http://en.wikipedia.org/wiki/Discrete_event_simulation>`_ and the references therein as an entry point to this interesting field of Computer Science.

Briefly speaking, Discrete Event Simulation (DES) is a technique to *model* a complex system in order to study its behavior. The system is modeled as a collection of *states* that change over time. Within DES, the time advances in discrete steps.

A typical model of a system includes (a) *entities*, which are the active actors in the system and encapsulate the state and logic of the system components, (b) *resources*, which are consumed by the entities, (c) *communication* primitives, to coordinate actions between entities across time, and of course, (d) *statistics*, which is the output of a simulation run.

As we will see shortly, the SIM.JS library provides support for entities, resources (Facility, Buffers and Stores), communication (via Timers, Events and Messages) and statistics (with Data Series, Time Series and Population statistics).

.. _basics-design:

SIM.JS Design Principles
=========================

The most common design pattern that appears in DES models is as follows:

.. code-block:: python
    
    1. entity::
    2.  do_some_local_computation
    3.  resource = request_some_shared_resource
    4.  do_more_local_computation

It is possible that the said resource is not available currently, in which case the request cannot be immediately satisfied and the entity must, therefore, "block" from further execution.

Waiting for resources is only one examples where entities may need to wait. There are other cases as well, for example, wait for a timer to expire, wait to receive message from other entities, wait for a predicate condition to become true, and so on.

There are two broad categories for implementing this "blocking" behavior:

1. Process-based simulation.
2. Event-based simulation.

In process-based simulation, the entities behave very much like regular operating system processes. Each entity runs on a separate thread, and when an entity executes a command for which it must block, the entire thread is suspended. When the waiting condition is satisfied, the thread is resumed. In the example given above, the entity thread will block at line 3 until the resource is free, and then will resume to line 4.

In event-based simulation, the entities all run in a single thread. At the time of making a request, the entities provide a callback function that must be invoked when the waiting condition is over. This style of programming is widely used in Graphical User Interface designs where preconfigured callback functions are called by the system when any event of interest occurs (e.g. mouse click). However, it also means that the code must be restructured a little. The above example must be written as:

.. code-block:: python

    entity::
        do_some_local_computation
        request_some_shared_resource_with_callback(entity_get_resource)
        return
    
    entity_get_resource (resource)::
        do_more_local_computation

The proponents of process-based programming claim that their design leads to a better readability of code. Whereas the adherents of event-based programming argue that their approach is more structured since the actions for each different kind of events are encapsulated as different functions.

The SIM.JS library provides *event-based* programming model, for the following reasons:

* At the time of writing, only Mozilla Firefox with JavaScript version 1.7 supports process-based programming model via the ``yield`` keyword (`New is JavaScript 1.7 <http://developer.mozilla.org/en/new_in_javascript_1.7>`_). There are plans to add this support in the next version of ECMAScript Harmony (`the wiki page <http://wiki.ecmascript.org/doku.php?id=harmony:generators&s=generator>`_); however, as of today, process-based programming is not a portable paradigm across all platforms.
* The process-based designs are resource intensive, since each entity must run as separate thread and at the time of context switch, the entire call stack must be stored (and later restored).
* Process-based programming is not *idiomatic* JavaScript. Practitioners of JavaScript largely follow the event-based programming, and specially so given the powerful features of JavaScript, such as first class functions, closures, anonymous functions, function call chains and so on.

The SIM.JS Library
===================

The SIM.JS library introduces two class variables in the global namespace: ``Sim`` and ``Random``. The ``Sim`` class provides all functionality for Discrete Event Simulation, while the ``Random`` class provides random number generation capability.

The ``Sim`` namespace further provides following classes:

.. 
    * :class:`Sim` class. The simulator kernel.
    * :class:`Sim.Facility` class. :ref:`resources-facility` is a resource that is used by entities for a finite duration. There is a limit on the number of entities that can use the facility at a given time. As an example, consider a barbershop (the facility) with *m* barbers (capacity of facility). The customers arrive at shop and wish to 'use' the resource (barber); if all barbers are busy, the customers wait until one barber is available.
    * :class:`Sim.Buffer` class. :ref:`resources-buffer` is a resource that can store a finite number of *homogeneous* tokens. Any entity can store tokens in the buffer if there is free space, or retrieve existing tokens from the buffer if some are available.
	* :class:`Sim.Store` class. :ref:`resources-store` is a resource that can store a finite number of JavaScript objects. Any entity can store objects in the store if there is free space, or retrieve existing objects from the store if some are available.
    * :class:`Sim.Event` class. :ref:`events-events` are external objects that start out in *passive* state, and at some point in time will be *activated* or *fired*. Entities 'attach' themselves to events and wait until the event is fired.
    * :class:`Sim.Request` class. When an entity makes a request to the simulation -- such as set a timer, use a facility, etc -- the simulator returns back a :ref:`Request object <request-main>`. The entity can use this Request object to further modify the original request.
    * :class:`Sim.DataSeries` class. :ref:`Data Series <statistics-data-series>` is a collection of discrete, time-independent observations, for example, grades of each student in a class, length of rivers in United States. The :class:`~Sim.DataSeries` class provides a convenient API for recording and analyzing such observations, such as finding maximum and minimum values, statistical properties like average and standard deviation and so on.
    * :class:`Sim.TimeSeries` class. :ref:`Time Series <statistics-time-series>` is a collection of discrete time-dependent observations. That is, each observation value is associated with a discrete time instance (the time at which the observation was made). For example, the size of queue at time *t* during the simulation run, number of customers in a restaurant at time *t* during evening hours. Note that the time instances when the observations are made are discrete. Also note the difference between ``Data Series`` statistics which records time independent statistics. The :class:`~Sim.TimeSeries` class provides a convenient API for recording and analyzing such observations, such as finding maximum and minimum values, statistical properties like time-averaged mean and standard deviation and so on.
    * :class:`Sim.Population` class. :ref:`Population <statistics-population>` is actually a composite of the above two statistics, which models the behavior of population growth and decline.


+-----------------------+--------------------------------------------------------------+
|  Class                |  Purpose                                                     |
+=======================+==============================================================+
|:class:`Sim`           |The simulator kernel.                                         |
+-----------------------+--------------------------------------------------------------+
|:class:`Sim.Facility`  |:ref:`resources-facility` is a resource that is used by       | 
|                       |entities for a finite duration. There is a limit on the       |
|                       |number of entities that can use the facility at a given       |
|                       |time. As an example, consider a barbershop (the facility)     |
|                       |with *m* barbers (capacity of facility). The customers        |
|                       |arrive at shop and wish to 'use' the resource (barber);       |
|                       |if all barbers are busy, the customers wait until one         |
|                       |barber is available.                                          |
+-----------------------+--------------------------------------------------------------+
|:class:`Sim.Buffer`    |:ref:`resources-buffer` is a resource that can store a        |
|                       |finite number of tokens. Any entity can store tokens in       |
|                       |the buffer if there is free space, or retrieve existing       |
|                       |tokens from the buffer if some are available.                 |
+-----------------------+--------------------------------------------------------------+
|:class:`Sim.Store`     |:ref:`resources-store` is a resource that can store a finite  | 
|                       |number of                                                     |
|                       |JavaScript objects (actually any datatype: number, string,    |
|                       |function, array, object etc). Any entity can store objects    |
|                       |in the store if there is free space, or retrieve existing     |
|                       |objects from the store if some are available.                 |
+-----------------------+--------------------------------------------------------------+
|:class:`Sim.Event`     |:ref:`events-events` are external objects that start out      |
|                       |in *passive* state, and at some point in time will be         |
|                       |*activated* or *fired*. Entities 'attach' themselves to       |
|                       |events and wait until the event is fired.                     |
+-----------------------+--------------------------------------------------------------+
|:class:`Sim.Request`   |When an entity makes a request to the simulation -- such      |
|                       |as set a timer, use a facility, etc -- the simulator          |
|                       |returns back a :ref:`Request object <request-main>`. The      |
|                       |entity can use this Request object to further modify the      |
|                       |original request.                                             |
+-----------------------+--------------------------------------------------------------+
|:class:`Sim.DataSeries`|:ref:`Data Series <statistics-data-series>` is a              |
|                       |collection of discrete, time-independent observations, for    |
|                       |example, grades of each student in a class, length of         |
|                       |rivers in United States. The :class:`~Sim.DataSeries`         |
|                       |class provides a convenient API for recording and             |
|                       |analyzing such observations, such as finding maximum and      |
|                       |minimum values, statistical properties like average and       |
|                       |standard deviation and so on.                                 |
+-----------------------+--------------------------------------------------------------+
|:class:`Sim.TimeSeries`|:ref:`Time Series <statistics-time-series>` is a              |
|                       |collection of discrete time-dependent observations.           |
|                       |That is, each observation value is associated with a          |
|                       |discrete time instance (the time at which the observation     |
|                       |was made). For example, the size of queue at time *t*         |
|                       |during the simulation run, number of customers in a           |
|                       |restaurant at time *t* during evening hours.The               |
|                       |:class:`~Sim.TimeSeries` class provides a convenient API      |
|                       |for recording and analyzing such observations, such as        |
|                       |finding maximum and minimum values, statistical               |
|                       |properties like time-averaged mean and standard deviation     |
|                       |and so on.                                                    |
+-----------------------+--------------------------------------------------------------+
|:class:`Sim.Population`|:ref:`Population <statistics-population>` is actually a       |
|                       |composite of the above two statistics, which models the       |
|                       |behavior of population growth and decline.                    |
+-----------------------+--------------------------------------------------------------+

The ``Random`` library uses the Mersenne Twister algorithm for generating random number stream, and is based on the JavaScript implementation by Makoto Matsumoto and Takuji Nishimura (`code <www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/VERSIONS/JAVASCRIPT/java-script.html>`_). The ``Random`` class supports following probability distribution functions:

.. hlist::
    :columns: 4
    
    * :func:`~Random.exponential`
    * :func:`~Random.gamma`
    * :func:`~Random.normal`
    * :func:`~Random.pareto`
    * :func:`~Random.triangular`
    * :func:`~Random.uniform`
    * :func:`~Random.weibull`

Using SIM.JS
=================

Take a look at :ref:`tutorials and examples <tutorial-main>` to get a feel for writing simulation models with SIM.JS.
