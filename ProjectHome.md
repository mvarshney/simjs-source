**SIM.JS is a general-purpose Discrete Event Simulation library written entirely in JavaScript.**

More information and documentation at http://www.simjs.com

SIM.JS is a library for modeling discrete time event systems:

  * The library provides constructs to create Entity which are the active actors in the system and encapsulate the state and logic of the system operations.

  * The entities contend for **resources**, which can be Facilities (services that are requested by entities; supports FIFO, LIFO with preemption and Processor Sharing service disciplines) and Buffers (resources that can store finite amount of tokens; entities store or retrieve tokens from the buffers).

  * The entities communicate by waiting on Events or by sending Messages.

  * Statistics recording and analysis capability is provided by Data Series (collection of discrete, time-independent observations), Time Series (collection of discrete, time-dependent observations) and Population (the behavior of population growth and decline).

  * SIM.JS also provides a random number generation library to generate seeded random variates from various distributions, including uniform, exponential, normal, gamma, pareto and others.

**SIM.JS is written in _idiomatic_  JavaScript**. The library is written in event-based design paradigm: the changes in system states are notified via callback functions. The design takes advantage of the powerful feature sets of JavaScript: prototype based inheritance, first-class functions, closures, anonymous functions, runtime object modifications and so on. Of course, a knowledge of these principles is not required (a lot of this behind the scenes), but we do certainly hope that using SIM.JS will be pleasurable experience for the amateur as well as the experienced practitioners of JavaScript.