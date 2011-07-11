==============================
Simulator and Entity
==============================

Simulator and Entities are the core of Discrete Event Simulation. Entities are the *actors* in the system -- they request resources, communicate with other entities and so on. Simulator is the backbone that provides the necessary framework, including the notion of *simulated clock*. The basics of discrete event simulation are discussed in :ref:`introduction-simjs`.

.. _entity-simulator:

Simulator
==========

The SIM.JS library provides a global class variable :class:`Sim`, an instance of which defines one simulation process.

The steps in creating a simulation run are quite simple:

1. Create an object of :class:`Sim` class.
2. Create entity objects via :func:`~Sim.addEntity` function call. This function takes ``Entity Prototype`` (see :ref:`entity-entity` below) object to create entity objects.
3. Start the simulation by calling :func:`~Sim.simulate`.

API Reference
---------------

.. js:class:: Sim()
    
    Creates an instance of discrete event simulator.

.. js:function:: Sim.addEntity(entityPrototype)

    Adds an entity in the simulation environment. The entity object inherits from the ``entityPrototype`` object. The simulator also adds several other API function in the prototype. See :ref:`entity-entity` for further details.
    
.. js:function:: Sim.simulate(duration)

    Starts the simulation. ``duration`` is the time until which the simulation runs.

.. js:function:: Sim.setLogger(loggerFn)

    Assigns a function that will be called by the simulator when logging messages.

.. js:function:: Sim.log(message)
	
    Logs a message using a logger function defined in :func:`~Sim.setLogger`.

.. _entity-entity:

Entity
=========

Entities are the actors in the simulation. SIM.JS uses the JavaScript's *prototype inheritance* concept to differentiate between the behavior representation (similar to *class* in C++ or Java) and the runtime representation (similar to *objects* in C++ or Java).

As programmers, we create an ``Entity Prototype`` JavaScript object. This is like any other JavaScript object, except for the following constraints:

* The object must have a ``start()`` function. This function is called by the simulator when the simulation starts.
* There are reserved function and attribute names (see :ref:`entity-prototype` for a complete list) that must not be used in the object.

An example of a very simple ``Entity Prototype`` object could be:

.. code-block:: js

    var EntityPrototype = {
        start: function() {
            // This function is necessary!
            // This function is called by simulator when simulation starts.
            document.write("the simulation has started!").
        }
    };
    
Think of ``Entity Prototype`` objects as *classes* in languages like C++ or Java. This class will be used to create *objects*, which are the runtime representation of entities. We call these runtime objects as ``Entity Objects``, which are *instances* of ``Entity Prototypes``.

The ``Entity Objects`` are created by the :func:`Sim.addEntity` function:

.. code-block:: js

    // Create entity object from the entity prototype object
    var entityObject = sim.addEntity(EntityPrototype);
    
    // More than one entity objects can be created by same entity prototype object
    var anotherEntityObject = sim.addEntity(EntityPrototype);

The :func:`Sim.addEntity` function performs three actions:

1. *Extends* the ``Entity Prototype`` object by adding new functions and attributes to the original prototype object. :ref:`entity-prototype` lists these functions and attributes.
2. *Creates* a new object which inherits the ``Extended Entity Prototype``.
3. Assigns a unique integer value to the :attr:`id` attribute of the object.

The entire process is illustrated in the diagram below:

.. image:: images/entity-prototype.png

The input to the :func:`Sim.addEntity` function is ``Entity Prototype`` object. This is an object that we have written to model the components of system for our discrete simulation problem.

The simulator adds other useful functions and attributes (see below for complete list) to the ``Entity Prototype`` object. We call this object as ``Extended Entity Prototype``.

The simulator then creates an object (the ``Entity Object``) which inherits from the ``Extended Entity Prototype`` object (for example, via the *Object.create* function on platforms where it is supported).

This new ``Entity Object`` is returned to the user program.

Entity Prototype
------------------

As noted earlier, the ``Entity Prototype`` object must define :func:`start` function. This function is called by the simulator when the simulation starts. It is this function where the entities initialize their state and schedule future events in the simulator.

The prototype object may optionally have a :func:`finalize` function. This function is called when the simulation terminates.

The prototype object may optionally have a :func:`onMessage` function. This function is called when some other entity has sent a :ref:`Message <events-messages>`.


.. _entity-prototype:

Extended Entity Prototype API
---------------------------------

The SIM.JS library adds following functions and attributes to the ``Entity Prototype`` object.

.. note:: The function and attribute names listed below should be treated as "reserved keywords" when writing the ``Entity Prototype`` code.

These functions and attributes are added when :func:`Sim.addEntity` function is called. For example,

.. code-block:: js

    var EntityPrototype = { 
        start: function() {
            var now = this.time(); // Where did we get this time() function from? See below..
            document.write("The time now is " + now);
        } 
    };
    
    assert(EntityPrototype.time === undefined); // the object does not have a time method (yet)!
    
    var obj = sim.addEntity(EntityPrototype);   // create an object from prototype
    
    // EntityPrototype object has been "extended".
    // For example, the time() function is added
    assert(EntityPrototype.time instanceof Function);
    
    // Since obj inherits from the extended prototype object, it will have methods
    //  defined in EntityPrototype as well as those added by the simulator.
    assert(obj.start instanceof Function);
    assert(obj.time instanceof Function);

.. js:attribute:: id

    The unique id of the entity. The ``id`` will be unique for entity objects even if they are derived from same prototype.

.. js:function:: time()
    
    Returns the current simulation time.

.. js:function:: setTimer(delay)

    Sets an internal timer that expires after ``delay`` duration. This function returns a :ref:`Request <request-main>` object.
    
    .. seealso:: :ref:`events-timers`.

.. js:function:: waitEvent(event)

    Waits on the ``event`` :ref:`Event <events-events>`. This function returns a :ref:`Request <request-main>` object.
    
    The difference between :func:`waitEvent` and :func:`queueEvent` is that when the event triggers (or fires), *all* waiting entities are notified, and only one queued entity (the one at the head of the queue) is notified.
    
    .. seealso:: :ref:`events-events`.
    
.. js:function:: queueEvent(event)

    Queue for the ``event`` :ref:`Event <events-events>`. The function returns a :ref:`Request <request-main>` object.
    
    The difference between :func:`waitEvent` and :func:`queueEvent` is that when the event triggers (or fires), *all* waiting entities are notified, and only one (the one at the head of the queue) is notified.
    
    .. seealso:: :ref:`events-events`.

.. js:function:: send(message, delay[, entities])

    Sends the ``message`` to other entities after a ``delay``. ``entities`` can be:
    
    * omitted or null. The message is sent to *all* entities (excluding self).
    * Entity object: The message is send to the entity object.
    * Array of entity objects: The message is sent to all entities in array.
    
    This function does not return any value.
    
    .. seealso:: :ref:`events-messages`.

.. js:function:: useFacility(facility, duration)

    Request to use the ``facility`` for ``duration`` duration. This function returns a :ref:`Request <request-main>` object.
    
    .. seealso:: :ref:`resources-facility`.

.. js:function:: putBuffer(buffer, amount)
    
    Request to put ``amount`` quantity of tokens in the ``buffer``. This function returns a :ref:`Request <request-main>` object.
    
    .. seealso:: :ref:`resources-buffer`.

.. js:function:: getBuffer(buffer, amount)

    Request to retrieve ``amount`` quantity of tokens from the ``buffer``. This function returns a :ref:`Request <request-main>` object.
    
    .. seealso:: :ref:`resources-buffer`.

.. js:function:: putStore(store, object)

	Request to store ``object`` in the ``store``. ``object`` can be any JavaScript value (numbers, strings, functions, objects, arrays etc). This function returns a :ref:`Request <request-main>` object.
	
	.. seealso:: :ref:`resources-store`.

.. js:function:: getStore(store[, filter])

	Request to retrieve object from the ``store``. If the filter function is supplied then the first object (in FIFO order) that matches the filter is retrieved; otherwise the first object in FIFO order is retrieved. The retrieved object can be accessed via the :attr:`this.callbackMessage` attribute in the callback function. This returns a :ref:`Request <request-main>` object.

	.. seealso:: :ref:`resources-store`.	