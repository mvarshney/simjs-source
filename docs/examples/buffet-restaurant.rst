.. _example-buffet-restaurant:

====================
Buffet Restaurant
====================

The System
=============

In this example, we will model as buffet-style restaurant. Customer arrive at restaurant, pick up food from buffet area (we will will assume only one food item: salad), reach cashier for payment and leave the restaurant. The salad buffet is a finite resource, and is replenished every few minutes by the chef. In this restaurant the customers may have to wait at two places:

* At the buffet. If the salad is all gone, customers have to wait until the chef brings in more.
* At the cashier. If there are other customers ahead in line.

The customizable parameters for this restaurant model are:

1. Salad preparation time. Time taken by chef to prepare the next round of fresh salad. We will assume this is a constant time interval.
2. Customer arrival rate. We will assume that the arrivals is a Poisson process.
3. Time taken by cashier per customer. We will assume this to be exponentially distributed.
4. The capacity of salad buffet. This is a constant and will not change over the course of simulation.

**Simulation Objectives**. We would like to find out:

* The average time spent by customers at the restaurant?
* The average number of customers inside the restaurant?

Modeling with SIM.JS
======================

We observe first that the system has two resources:

1. The salad buffet. We will model this as :ref:`resources-buffer`.
2. The cashier. We will model her as :ref:`resources-facility`.

There will be two entities in the system: the chef and the customers. As in the earlier example, we will model customers as one entity object.

We will use :ref:`statistics-population` to record the arrival and departure of customers.

The following code lists all the global variables we will need in our simulation:

.. code-block:: js

    var sim = new Sim(); 
    var stats = new Sim.Population();
    var cashier = new Sim.Facility('Cashier');
    var buffet = new Sim.Buffer('Buffet', BuffetCapacity);
    var random = new Random(Seed);

Lets start with the Entity Prototype for Chef first. The chef replenishes the salad buffer every *PreparationTime* interval. The code is very simple:

.. code-block:: js

    var Chef = {
        start: function () {
            this.putBuffer(buffet, BuffetCapacity - buffet.current());
            this.setTimer(PreparationTime).done(this.start);
        }
    };
   
Note here that the chef fills only the empty portion in the buffet.

Next, let us look at the Customer entity. This entity prototype will generate request for all customers, where the time interval between customer arrivals is exponentially distributed. We will first look at the start function, which is somewhat similar to the start function of Chef. The customer will order (this.order(), which we will see next), and the function is called again after an exponentially distributed random delay: 

.. code-block:: js

    var Customer = {
        start: function () {
            this.order();

            var nextCustomerAt = random.exponential (1.0 / MeanArrival); 
            this.setTimer(nextCustomerAt).done(this.start);
        },
        ...

The :func:`Customer.order` function models the actions of customers inside the restaurant. First we will log the arrival of customer (line 3) and record in the statistics object (line 6). The customer then request to *get* one unit from the buffer (line 8) and will execute the anonymous function (argument to :func:`done` function) when the request is satisfied. The request may be satisfied immediately, if the buffer not empty, or wait otherwise. In the callback function, we log again that the customer has cleared the buffer stage and will now proceed to the cashier (line 10). The service time at cashier is also exponential distributed (line 13), and we use the :func:`this.useFacility` function to request service from the cashier (line 14). The callback function here will log that the customer will not leave the restaurant (line 16) and we also record this time in the statistics (line 20). Note also that we are using the :func:`Request.setData` function to remember the arrival time (which is read later on from :attr:`this.callbackData` attribute).

.. code-block:: js
   :linenos:

    order: function () {
        // Logging
        sim.log("Customer ENTER at " + this.time());

        // statistics
        stats.enter(this.time());

        this.getBuffer(buffet, 1).done(function () {
            // Logging
            sim.log("Customer at CASHIER " + this.time() 
                + " (entered at " + this.callbackData + ")");
            
            var serviceTime = random.exponential(1.0 / CashierTime);
            this.useFacility(cashier, serviceTime).done(function () {
                // Logging
                sim.log("Customer LEAVE at " + this.time() 
                    + " (entered at " + this.callbackData + ")");
                
                // Statistics
                stats.leave(this.callbackData, this.time());
            }).setData(this.callbackData);
        }).setData(this.time());
    }

Finally, we create entities (lines 1 and 2), optionally set a logger function (lines 5-7), start the simulation (line 9) and report back the statistics (line 11).

.. code-block:: js
    :linenos:

    sim.addEntity(Customer);
    sim.addEntity(Chef);


    sim.setLogger(function (msg) {
        document.write(msg);
    });

    sim.simulate(Simtime);

    return [stats.durationSeries.average(),
            stats.durationSeries.deviation(),
            stats.sizeSeries.average(),
            stats.sizeSeries.deviation()];

`View the complete source code <buffet_restaurant.js>`_.

Running Simulation
======================
This javascript code can be executed where ever javascript can run. This includes:

* As a script in HTML page on a web browser.
* Via Web browser JavaScript debuggers such as Mozilla Firebug, Safari's Developer tools etc.
* With `Rhino <www.mozilla.org/rhino>`_.
* With ``jrunscript``.
* and so on...

We will run our model as a web page on a web browser. For this we have created the following web page:

.. code-block:: js

    <html>
    <head>
        <title>Tutorial: Customers at a Buffet Restaurant</title>
  
        <script type="text/javascript" src="sim-0.1.js"></script>
        <script type="text/javascript" src="buffet_restaurant.js"></script>
    </head>
    <body></body>
    </html>

Buffer Restaurant in Action
=============================

You can `play with this simulation model <buffet_restaurant.html>`_. Try out different values of input parameters and compare the output statistics of model.