=============================
Timers, Events and Messages
=============================

.. default-domain:: js

This section covers the various mechanisms by which entities can plan actions for themselves at different time instances, as well as coordinate with other entities.

:ref:`events-timers` allow entities to execute functions after a delay.

:ref:`events-events` are objects that can help synchronize actions among multiple entities.

:ref:`events-messages` are objects that entities can send to each other.

.. _events-timers:

Timers
========

Timers are mechanisms for *delayed executions* of functions. An entity can specify a JavaScript function and a duration (in simulated time) after which this function must be executed.

The :func:`setTimer` function in the Entity Prototype provides an API to execute function after a timeout.

Some examples:

.. code-block:: js
    :linenos:
    
    var Entity = {
        start: function () {
            // Execute an anonymous function after 10 seconds
            this.setTimer(10).done(function () {
                document.write("The simulation time must be 10 now.");
            });
            
            // Execute a local function after 20 seconds
            this.setTimer(20).done(this.specialHandler);
        },
        specialHandler: function () {
            document.write("Special Handler: executed every 20 seconds");
            
            // Recursively calling a function (will not overflow on stack)
            this.setTimer(20).done(this.specialHandler);
        },
        onTimeout: function () {
            document.write("Default handler: time now must be 30");
        }
    }

The :func:`setTimer` function takes one argument -- the duration after which the timer must expire and some action must be taken.

The setTimer function returns a ``Request`` object. Refer to :ref:`request-main` documentation on how to further modify the setTimer request.

If the timeout value is 0, the action function will be called *after* the current function has finished executing. This way, there will be recursive function calls and no chance of stack overflow in case of recursive delayed functions. 

.. code-block:: js
    
    start: function () {
        // Action functions are called *after* the current function has returned
        this.setTimer(0).done(function () {
            document.write("I will print as second line.");
        });
        
        document.write("I will print as first line.");
    }

.. note::
    The action function is executed in context of the entity. That is, it will be equivalent to *actionFunction*.\ ``call``\ (*entity*).

.. _events-events:

Events
=========
Events are external objects that start out in *passive* state, and at some point in time will be *activated* or *fired*. Entities 'attach' themselves to events and wait until the event is fired. There are two ways in which entities can attach with events:

1. *Wait for Event*. All entities that wait for events will be notified when the event fires.
2. *Queue for Event*. Entities join a queue, and only the front entity will be notified when the event fires. Once notified, the entity is removed from the queue, and the next in queue entity will be notified when the event fires the second time.

The events can fire in two ways:

1. *Flash fire*. The event fires `for an instant` (more technically: for zero simulated time duration). When the event fires, it notifies all entities that were waiting and one entity in the queue, and then reverts back to passive state. Any request (wait or queue) after this will have to wait until the next time the event is fired.
2. *Sustained fire*. The event fires and remains in activated state for an indefinite period until explicitly reset to passive state. When the event fires, it notifies all entities that were waiting and *all* entities in the queue. Any request (wait or queue) coming after the event is fired, and before the event is reset, will be serviced immediately.

An example of flash fire would be clock changing the date 'at the stroke of midnight'. Only the entities that were already waiting before the midnight will be notified. Any entity that requested the event after midnight will have to wait until the next fire event (midnight next night). The event itself can be considered to have happened in zero time.

An example of sustained fire would be traffic lights. When the traffic light is red (passive state), the entities (cars) will wait. Once the lights are green (fired) they remain in fired state until explicitly reset to passive state. Any request arriving during the period when the event is activated will be services immediately.

An event object is created as:

.. code-block:: js
    
    var event = new Sim.Event(name)


.. js:class:: Sim.Event([name])
    
    ``name`` is an optional parameter used for identifying the event in statistics reporting and tracing.
    
    The event will start out in passive state.

The events are fired by :func:`~Sim.Event.fire` function and reset to passive state by :func:`~Sim.Event.clear` function.

.. js:function:: Sim.Event.fire([keepFired])

    ``keepFired`` (boolean) is an optional argument to indicate that the event must remain in fired state (the sustained fire mode). The default value is false.

.. js:function:: Sim.Event.clear()
    
    Reset the event to passive state. This function has no effect if the event is already in passive state.
    
The entities can wait or queue on events by :func:`waitEvent` and :func:`queueEvent`, respectively, as defined in the :ref:`entity-prototype` section.

An example demonstrating the behavior of waitEvent and queueEvent:

.. code-block:: js
    
    var barrier = new Sim.Event('Barrier');
    var funnel = new Sim.Event('Funnel');
    var Entity = {
        start: function () {
            this.waitEvent(barrier).done(function () {
                document.write("This line is printed by all entities.");
            });
            
            this.queueEvent(funnel).done(function () {
                document.write("This line is printed by one entity only");
            });
            
            if (this.master) {
                this.setTimer(10)
                .done(barrier.fire, barrier)
                .done(funnel.fire, funnel);
            }
        }
    }
    
    var sim = new Sim();
    var entities = [];
    for (var i = 0; i < NUM_ENTITIES; i++) { 
        entities.push(sim.addEntity(Entity)); 
    }
    entities[0].master = true;
    sim.simulate(SIMTIME);
    
An example demonstrating the behavior of flash and sustained event fire:

.. code-block:: js

    var sustained = new Sim.Event('Sustained Event');
    var flash = new Sim.Event('Flash Event');
    var Entity = {
        start: function () {
            // one second before fire
            this.setTimer(9).done(function() { 
                this.waitEvent(sustained).done(function () {
                    document.write("Notified at time 10.");
                });
                
                this.waitEvent(flash).done(function () {
                    document.write("Notified at time 10.")
                })
            });
            
            // one second after fire
            this.setTimer(11).done(function() { 
                this.waitEvent(sustained).done(function () {
                    document.write("Notified at time 11.");
                });
                
                this.waitEvent(flash).done(function () {
                    document.write("Will not be notified :(")
                })
            });

            // Trigger both events at time = 10
            this.setTimer(10)
            .done(function() { sustained.fire(true); });
            .done(flash.fire, flash);
        }
    }
    
    

.. _events-messages:

Messages
==========

Messages are objects that entities can send to each other. The messages can be any JavaScript type -- numbers, string, functions, arrays, objects etc. 

Entities send messages using the :func:`send` ``Extended Entity Prototype`` function (see also :ref:`entity-prototype`). The signature of this function is:

.. js:function:: send(message, delay[, entities])

    Sends the ``message`` to other entities after a ``delay``. ``entities`` can be:
    
    * omitted or null. The message is sent to *all* entities (excluding self).
    * Entity object: The message is send to the entity object.
    * Array of entity objects: The message is sent to all entities in array.
    
    This function does not return any value.

As an example, consider a ping-pong game played by two players where they send a string back and forth to each other. Before resending the string, each player appends his/her name to the string. We will model the two players as entities and the string as a message.

.. code-block:: js

    var Player = {
        start: function () {
            if (this.firstServer) {
                // Send the string to other player with delay = 0.
                this.send("INITIAL", 0, this.opponent);
            }
        },
        onMessage: function (sender, message) {
            // Receive message, add own name and send back
            var newMessage = message + this.name;
            this.send(newMessage, HOLDTIME, sender);
        }
    };
    
    var sim = new Sim();
    var jack = sim.addEntity(Player);
    var jill = sim.addEntity(Player);
    
    jack.name = "Jack";
    jill.name = "Jill";
    
    jack.firstServer = true;
    jack.opponent = jill;
    
    sim.simulate(SIMTIME);