.. _request-main:

===================
Request Objects
===================

.. default-domain:: js

When an entity makes a request to the simulation -- such as set a timer, use a facility, etc -- the simulator returns backs a ``Request`` object. The entity can use this Request object to further modify the original request.

.. _request-generation:

The ``Request`` object is returned when an entity makes any of the following requests:

* To set a timer, via :func:`setTimer`.
* To use a facility, via :func:`useFacility`.
* To put tokens in a buffer, via :func:`putBuffer`.
* To get tokens from buffer, via :func:`getBuffer`.
* To store objects in a store, via :func:`putStore`.
* To retrieve object from a store, via :func:`getStore`.
* To wait on an event, via :func:`waitEvent`.
* To queue on an event, via :func:`queueEvent`.

The ``Request`` object can then be used to modify the request in the following ways:

* :func:`~Sim.Request.done`: Assign functions that must be called when the request is satisfied.
* :func:`~Sim.Request.waitUntil`: Set a timeout value to the request. If the request is not satisfied within the timeout value, it will be terminated and the entity will be notified.
* :func:`~Sim.Request.unlessEvent`: Put the request in the wait queue of one or more :ref:`events-events`. If any one of those events is fired, the request will be terminated and the entity will be notified.
* :func:`~Sim.Request.setData`: Assign some user data for this request, which will be returned back when the simulator notifies the entity about the request.
* :func:`~Sim.Request.cancel`: Cancel the request.

Except for :func:`~Sim.Request.cancel`, all other functions return the ``Request`` object back, therefore, these functions can be *chained* together. For example:

.. code-block:: js

    // Example of chained function calls
    
    this.putBuffer(buffer, 10)
    .done(fnWhenSatisfied)
    .done(fnAlsoWhenSatisfied)
    .waitUntil(10, fnCouldNotAllocIn10Sec)
    .unlessEvent(event1, fnEvent1Happened)
    .unlessEvent(event2, fnEvent2Happened)
    .setData('give me this data when ANY callback function is called');

The following table summarizes the various outcomes of a request and which callback functions are called in each case:

+-----------------+---------------+--------------------+--------------------+
|Outcome of       | callback      |  callback          |  callback          |
|Request          | in done()     |  in waitUntil()    |  in unlessEvent()  |
+=================+===============+====================+====================+
| Request is      |   Yes         |    No              |  No                |
| satisfied       |               |                    |                    |
+-----------------+---------------+--------------------+--------------------+
| Timeout         |   No          |    Yes             |  No                |
| occurs          |               |                    |                    |
+-----------------+---------------+--------------------+--------------------+
| Event is        |   No          |    No              |  Yes               |
| fired           |               |                    |                    |
+-----------------+---------------+--------------------+--------------------+
| cancel()        |   No          |    No              |  No                |
| called          |               |                    |                    |
+-----------------+---------------+--------------------+--------------------+

API Reference
~~~~~~~~~~~~~~~~

.. js:class:: Sim.Request()

    .. note::
    
        The ``Request`` constructor should be considered as a private API. Application code should not explicitly create objects of this class. 

.. js:function:: Sim.Request.done(callback[, context[, argument]])

    ``callback`` is a function (named or anonymous) that must be called when the request is satisfied. 
    
    ``context`` is the object in whose context the function will be called. The behavior is therefore equivalent to: ``callback.call(context)``. If ``context`` argument is not provided or is set to a value that evaluates to *false*, it is assumed to be the calling entity object.
    
    ``argument`` are the optional arguments that are passed to the callback function. If ``argument`` is an array then the simulator will execute ``callback.apply(context, argument)``, otherwise the simulator will execute ``callback.call(context, argument)``.
    
    **Note 1:** This function can be called multiple times for the same request object, in which case all the callback functions will be called. The simulator guarantees that the the ordering of callback functions will be same as the order in which they were added.
    
    **Note 2:** If this function is not applied for a request object, then the simulator will still schedule this request and handle it appropriately. Other callback functions defined in :func:`~!Sim.Request.waitUntil` or :func:`~!Sim.Request.unlessEvent` may still be called. This is useful when the application is interested in error conditions only, for example:
    
    .. code-block:: js
        
        // done() function is not applied to the request object.
        // The simulator will schedule and process this request appropriately,
        // and may call the other callback functions.
        this.putBuffer(buffer, 10)
        .unlessEvent(event, handleEvent)
        .waitUntil(event, handleTimeout);

    **Note 3:** Even if the request is immediately satisfied (for example, buffer has enough free space for the *put* request), the callback function will still be called *after* the function scope that made this request has finished. That is:

    .. code-block:: js
    
        start: function() {
            // Adding 0 units.. should always succeed immediately
            this.putBuffer(buffer, 0).done(function () {
                document.write("I will be printed as second line.");
                });
            document.write("I will be printed as first line.");
        }

.. js:function:: Sim.Request.waitUntil(duration, callback[, context[, argument]])
    
    Set a timeout value to the request. If the request is not satisfied within the       ``duration`` time interval, it will be terminated and the ``callback`` function will be called.
    
    ``context`` is the object in whose context the function will be called. The behavior is therefore equivalent to: ``callback.call(context)``. If ``context`` argument is not provided or is set to value that evaluates to *false*, it is assumed to be the calling entity object.
    
    ``argument`` are the optional arguments that are passed to the callback function. If ``argument`` is an array then the simulator will execute ``callback.apply(context, argument)``, otherwise the simulator will execute ``callback.call(context, argument)``.
    
    As noted in the table above, if the timeout occurs then no other callback function (for example, in :func:`~!Sim.Request.done` or :func:`~!Sim.Request.unlessEvent`) will be called.
    
    **Note:** The API does not prevent calling this function multiple times, however, note that only one callback function (the one with smallest timeout value) is effectively useful.

.. js:function:: Sim.Request.unlessEvent(event, callback[, context[, argument]])

    ``event`` is either:
    
    * an object of :class:`Event` instance type, or
    * an array of objects, each an instance of :class:`Event`.
    
    Puts the request in the wait queue of one or more events. If any of those events are fired, the request will be terminated and the ``callback`` function will be called. 
    
    ``context`` is the object in whose context the function will be called. The behavior is therefore equivalent to: ``callback.call(context)``. If ``context`` argument is not provided or is set to value that evaluates to *false*, it is assumed to be the calling entity object.
    
    ``argument`` are the optional arguments that are passed to the callback function. If ``argument`` is an array then the simulator will execute ``callback.apply(context, argument)``, otherwise the simulator will execute ``callback.call(context, argument)``.
    
    As noted in the table above, if the timeout occurs then no other callback function (for example, in :func:`~!Sim.Request.done` or :func:`~!Sim.Request.waitUntil`) be called.
    
    **Note:** This function can be called multiple times for the same request object. Note that if one event appears in more than one :func:`~!Sim.Request.waitUntil` function, even then only one callback functions will be called. The simulator will non-deterministically select which callback function to call. The following table summarizes the semantics of the callback behavior of this function. Assume *ev1* and *ev2* are two events, and *request* is the Request object.
    
    +-------------------------------------------------------+---------------+--------------------+
    |              Code                                     |    ev1 fired  |     ev2 fired      |
    +=======================================================+===============+====================+
    | request.unlessEvent(ev1, fn1).unlessEvent(ev2, fn2)   | fn1 called    | fn2 called         |
    +-------------------------------------------------------+---------------+--------------------+
    | request.unlessEvent([ev1, ev2], fn1)                  | fn1 called    | fn1 called         |
    +-------------------------------------------------------+---------------+--------------------+
    | request.unlessEvent(ev1, fn1).unlessEvent(ev1, fn2)   | one of f1 or  |                    |
    |                                                       | fn2 called    |                    |
    +-------------------------------------------------------+---------------+--------------------+


.. js:function:: Sim.Request.setData(data)

    ``data`` can be any data type (primitive type, arrays, objects etc) which will be returned back when the simulator notifies the entity about the request.
    
    From within the callback function, this data can be accessed through the ``this.callbackData`` attribute. This attribute is defined only during the scope of the callback function, and only during the time when the callback function is executing.
    
    This function can be called multiple times for the same request object, but each new invocation will `overwrite` the data from previous calls.
    
    The data, once set, will be returned to all callback function (if they are called).

    For example:
    
    .. code-block:: js
    
        var Entity = {
            start: function () {
                this.putBuffer(buffer, 10)
                .done(this.fn1)
                .unlessEvent(e, this.fn2)
                .setData('my data');
                
                // this.userData is undefined outside the callback functions
                assert(this.callbackData === undefined);
            },
            fn1: function () {
                assert(this.callbackData === 'my data');
            },
            fn2: function () {
                // this.userData is visible in all callback functions
                assert(this.callbackData === 'my data');
            }
        };
        
    
.. js:function:: Sim.Request.cancel()

    Cancel a request. After this call, no callback function will be called.
    
.. note::

    Special case with facilities.
    
    In case of facilities with FIFO queuing discipline, the requesting entities go through two stages: (1) wait for the facility to become free (this may be zero duration if the facility is already free), and (2) use the facility for specified duration. The :func:`~!Sim.Request.waitUntil`, :func:`~!Sim.Request.unlessEvent` and :func:`~!Sim.Request.cancel` functions are applicable in the first stage only. In order words, if an entity has started using the facility, then it cannot be dislodged and these function calls will have no effect.
    
    In case of facilities with LIFO and Processor Sharing disciplines, the requesting entities obtain an immediate access to the facility resource. Therefore, :func:`~!Sim.Request.waitUntil`, :func:`~!Sim.Request.unlessEvent` and :func:`~!Sim.Request.cancel` functions will have no effect for these facilities.


.. _request-callbacks:

Callback Functions
~~~~~~~~~~~~~~~~~~~~

Request class has three functions that accept callback functions: :func:`~Sim.Request.done`, :func:`~Sim.Request.waitUntil` and :func:`~Sim.Request.unlessEvent`.  Before calling the callback functions, the simulator may assign one or more of these attributes in the ``context`` object:

* :attr:`this.callbackSource`. The object for which this request was made.
    * for :attr:`setTimer()`, :attr:`this.callbackSource` is equal to *undefined*.
    * for :attr:`useFacility(fac)`, :attr:`this.callbackSource` is equal to *fac*.
    * for :attr:`putBuffer(buf)`, :attr:`this.callbackSource` is equal to *buf*.
    * for :attr:`getBuffer(buf)`, :attr:`this.callbackSource` is equal to *buf*.
    * for :attr:`putStore(store)`, :attr:`this.callbackSource` is equal to *store*.
    * for :attr:`getStore(store)`, :attr:`this.callbackSource` is equal to *store*.
    * for :attr:`waitEvent(event)`, :attr:`this.callbackSource` is equal to *event*.
    * for :attr:`queueEvent(event)`, :attr:`this.callbackSource` is equal to *event*.
* :attr:`this.callbackMessage`. Provides additional information. Currently, this attribute is set in following cases only:
	* If the request had a :func:`~!Sim.Request.unlessEvent` clause and the corresponding callback function is called. This attribute points to the event that led to this callback function.
	* For :attr:`useFacility(fac)`, the callback in :func:`~Sim.Request.done` reports the server id that was allocated to this request.
	* For :attr:`getStore(store)`, the callback in :func:`~Sim.Request.done` points to the object that is returned by the store.
* :attr:`this.callbackData`. User defined data through :func:`~Sim.Request.setData`.