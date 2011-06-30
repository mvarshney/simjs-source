.. JSDES documentation master file, created by
   sphinx-quickstart on Tue Jun 21 14:41:02 2011.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

.. Welcome to JSDES's documentation!
	=================================

SIM.JS
=======

**SIM.JS is a general-purpose Discrete Event Simulation library written entirely in JavaScript.**

.. sidebar:: Table of Contents

	.. toctree::
		:maxdepth: 1

		basics
		tutorial
		simulator
		random
		download


SIM.JS is a library for modeling discrete time event systems: 

* The library provides constructs to create :ref:`Entities <entity-entity>` which are the active actors in the system and encapsulate the state and logic of the system operations. 
* The entities contend for *resources*, which can be :ref:`Facilities <resources-facility>` (services that are requested by entities; facilities have a maximum limit on number of concurrent users) and :ref:`Buffers <resources-buffer>` (resources that can store finite amount of tokens; entities store or retrieve tokens from the buffers). 
* The entities communicate by waiting on :ref:`events-events` or by sending :ref:`events-messages`. 
* Statistics recording and analysis capability is provided by :ref:`statistics-data-series` (collection of discrete, time-independent observations), :ref:`statistics-time-series` (collection of discrete, time-dependent observations) and :ref:`statistics-population` (the behavior of population growth and decline). 
* SIM.JS also provides a random number generation library to generate seeded random variates from various distributions, including uniform, exponential, normal, gamma, pareto and others.

**SIM.JS is written in *idiomatic* JavaScript**. The library is written in event-based design paradigm: the changes in system states are notified via callback functions (:ref:`why not process-based? <basics-design>`). The design takes advantage of the powerful feature sets of JavaScript: prototype based inheritance, first-class functions, closures, anonymous functions, runtime object modifications and so on. Of course, a knowledge of these principles is not required (a lot of this behind the scenes), but we do certainly hope that using SIM.JS will be pleasurable experience for the amateur as well as the experienced practitioners of JavaScript. 


.. topic:: Why Javascript?

	* The authors of this library are passionate about Discrete Event Simulations, and hope to see its widespread use in education as well as everyday applications. The authors also believe that in this era of Web 2.0, web-based applications are the best way to reach people. Which is why they concluded that there is a need for a Web enabled simulation engine.
	* These days when one can `boot linux <http://bellard.org/jslinux>`_ with JavaScript, play `Doom <http://developer.mozilla.org/en-US/demos/detail/doom-on-the-web>`_, run myriad of productivity applications on the Web, we ask -- why not simulations? And we say its about time!

