========================
Random Number Generation
========================

.. default-domain:: js

Why not ``Math.random()``?
---------------------------
The JavaScript's native ``Math.random()`` function is not suited for Discrete Event Simulations, since:

* The ``Math.random()`` function cannot be *seeded*. There is no way to guarantee that the same random stream will be produced the next time the script is executed.
* There is *only one stream* of random numbers. Statistics purists frown upon when two independent random distributions are drawn from same seed.
* The javascript library provides only the *uniform* probability distribution function. In DES, as also in many other scientific applications, there is a need for other kinds of distributions, such as *exponential*, *gaussian*, *pareto* etc.
* The native ``Math.random()`` does not use (at the time of writing) the arguably better *Mersenne Twister* algorithm for random number generator (see Mersenne Twister `website <http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html>`_ and Wikipedia `article <http://en.wikipedia.org/wiki/Mersenne_twister>`_).

The ``Random`` Library
-----------------------

.. sidebar:: Download random.js

	You can download the Random library separately at the :ref:`download page <download>`.

The ``Random`` library uses the Mersenne Twister algorithm for generating random number stream, and is based on the JavaScript implementation by Makoto Matsumoto and Takuji Nishimura (`code <www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/VERSIONS/JAVASCRIPT/java-script.html>`_).

The original code is wrapped around as a javascript class and there can be multiple objects each representing different random number streams. For example,

.. code-block:: js

	/* Demonstrate that random number streams can be seeded,
	 * and multiple streams can be created in a single script. */
	var stream1 = new Random(1234);
	var stream2 = new Random(6789);
	
	stream1.random(); // returns 0.966453535715118 always
	stream2.random(); // returns 0.13574991398490965 always

In addition, the ``Random`` library supports following probability distribution functions:

.. hlist::
	:columns: 4
	
	* :func:`~Random.exponential`
	* :func:`~Random.gamma`
	* :func:`~Random.normal`
	* :func:`~Random.pareto`
	* :func:`~Random.triangular`
	* :func:`~Random.uniform`
	* :func:`~Random.weibull`

API Reference
--------------

.. js:class:: Random ([seed])
    
	:param integer seed: An optional seed value. If this argument is not provided, then the seed value is set to ``new Date().getTime()``.


.. function:: Random.random()

	Returns a uniformly generated random floating point number in the range ``[0, 1.0)``.

.. js:function:: Random.exponential(lambda)

	Exponential distribution. ``lambda`` is the rate (inverse of mean) for the distribution. ``lambda`` is a required parameters, and must be non-negative and non-zero.

.. js:function:: Random.gamma(alpha, beta)

	Gamma distribution. ``alpha`` is sometimes also known as *shape* of the distribution, while ``beta`` as the *scale*. Both arguments are required.
	
	This function is adapted from Python 2.6 implementation of ``random.py``.

.. js:function:: Random.normal(mu, sigma)

	Normal (or Gaussian) distribution. ``mu`` is the mean of the Gaussian probability density function, and ``sigma`` is the standard deviation. Both parameters are required.


.. js:function:: Random.pareto(alpha)

	Pareto distribution. The ``alpha`` parameter is required.

.. js:function:: Random.triangular(lower, upper, mode)

	Triangular distribution. The random number are generated between the range (``lower``, ``upper``) with ``mode`` as the mode value. All three parameters are required.

.. js:function:: Random.uniform(lower, upper)

	Uniform distribution. Returns a uniformly generated random number in the range [``lower``, ``upper``). Both *lower* and *upper* arguments are required.

.. js:function:: Random.weibull(alpha, beta)
	
	Weibull distribution. Both ``alpha`` and ``beta`` parameters are required.