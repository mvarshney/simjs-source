function testRandom() {
	var stream1 = new Random(1234);
	var stream2 = new Random(6789);

	assertAlmost(stream1.random(), 0.966453535715118);
	assertAlmost(stream2.random(), 0.13574991398490965);
	
	stream1 = new Random(123);
	stream2 = new Random(123);
	for (var i = 0; i < 1000; i++) {
		assertAlmost(stream1.random(), stream2.random());
	}
}

function testRandomPython() {
	var seed1234 = [0.96645353569213877, 0.44073259917535268, 
	                0.0074914700585871907, 0.91097596244912415, 
	                0.93926899736376401, 0.58222757305894912, 
	                0.67156348148798506, 0.083938226837083962, 
	                0.7664809327917963, 0.23680977536311776, 
	                0.030814021726609964, 0.7887727172362835, 
	                0.3460889655971231, 0.62328147503916853, 
	                0.61581569510361522, 0.14855463870828756, 
	                0.18309064740993164, 0.11441296968868764, 
	                0.014618780486909122, 0.48675154060475834];
	var r = new Random(1234);
	r.pythonCompatibility = true;
	r.skip = false;
	for (var i = 0; i < 20; i++) {
		assertAlmost(r.random(), seed1234[i]);
	}
}

function testExponentialPython() {
	// exponential distribution; lambda = 0.5
	var seed1234_05 = [0.068244112607034252, 1.6386338770334943, 
	                   9.7879804624141009, 0.18647753593175062, 
	                   0.12530673726661459, 1.0817877773541513, 
	                   0.79629346129456369, 4.9553482909416759, 
	                   0.53189091331799898, 2.8809961914601603, 
	                   6.9595708834677659, 0.47455412794815088, 
	                   2.1221188219447842, 0.94551411277369857, 
	                   0.96961511295422631, 3.8136049019644278, 
	                   3.3955478154874248, 4.335881670115759, 
	                   8.4508964843355034, 1.4400029393011751];

	var r = new Random(1234);
	r.pythonCompatibility = true;
	r.skip = false;
	for (var i = 0; i < 20; i++) {
		assertAlmost(r.exponential(0.5), seed1234_05[i], 0.00001);
	}
}

function testGaussianPython() {
	// mu = 1.0, sigma = 0.5
	var seed1234_1_05 = [1.5271098209636194, 0.88722137212465679, 
	                     2.0985202741880902, 1.0517458948636846, 
	                     1.6130987648122463, 0.75399366162464332, 
	                     0.90094250304774082, 0.81554580077134631, 
	                     1.0379971855957939, 0.63437697344565724, 
	                     1.8652348954234261, 1.1696433129006212, 
	                     0.60334921733475277, 1.5751492422647289, 
	                     0.78825750073406875, 0.81138640485929792, 
	                     1.1005955819800799, 1.22501733328093, 
	                     1.5750581153602958, 1.0529695793333913];
	
	var r = new Random(1234);
	r.pythonCompatibility = true;
	r.skip = false;
	for (var i = 0; i < 20; i++) {
		assertAlmost(r.normal(1.0, 0.5), seed1234_1_05[i]);
	}
}

function testParetoPython() {
	// alpha = 0.5
	var seed1234_05 = [888.60037609781762, 3.1971351047794356, 
	                   1.0151530041282129, 126.17851900973129, 
	                   271.13095120480244, 5.7295492100631806, 
	                   9.2703711130022999, 1.191654833218333, 
	                   18.338140913912319, 1.7168581004918462, 
	                   1.0645982680808037, 22.412999189083507, 
	                   2.3386362015245372, 7.0463797695356822, 
	                   6.7751788283243544, 1.3793879648621017, 
	                   1.4984845293637592, 1.2750802088875131, 
	                   1.0298914162799759, 3.796161594445862];
	var r = new Random(1234);
	r.pythonCompatibility = true;
	r.skip = false;
	for (var i = 0; i < 20; i++) {
		assertAlmost(r.pareto(0.5), seed1234_05[i], 0.0001);
	}
}

function testTriangularPython() {
	var seed1234 = [0.87048848640398568, 0.46943189025424797, 
	                0.061202410322581211, 0.78902128359609847, 
	                0.82574300209713813, 0.5429592868567118, 
	                0.59476147856354089, 0.204863645917332, 
	                0.65829905823351642, 0.34410011287641112, 
	                0.12412498081895111, 0.67501747526696421, 
	                0.41598615697948599, 0.56599624139828497, 
	                0.56171681249654082, 0.27253865662350318, 
	                0.30256457774327422, 0.23917877172597032, 
	                0.085494972036106079, 0.4933312987256932];
		
	var r = new Random(1234);
	r.pythonCompatibility = true;
	r.skip = false;
	for (var i = 0; i < 20; i++) {
		assertAlmost(r.triangular(0, 1.0, 0.5), seed1234[i]);
	}
}


function testWeibullPython() {
	// alpha = 1.0, beta = 0.5
	var seed1234_1_05 = [11.524828679722953, 0.33770924624900073, 
	                     5.6545467864600952e-05, 5.8508298117564816, 
	                     7.8472870655468858, 0.76181200802999094, 
	                     1.2396856276607593, 0.007686288165356667, 
	                     2.1155456600844129, 0.07303396384054732, 
	                     0.00097961221882078911, 2.4174669605534174, 
	                     0.18044142100023094, 0.95307770766008859, 
	                     0.91514646876358918, 0.025863055846660821, 
	                     0.040895816888628082, 0.014763353916552117, 
	                     0.00021687533351373808, 0.44488262984328247];
	
	var r = new Random(1234);
	r.pythonCompatibility = true;
	r.skip = false;
	for (var i = 0; i < 20; i++) {
		assertAlmost(r.weibull(1.0, 0.5), seed1234_1_05[i], 0.00001);
	}
}

function testGamma() {
	var seed1234_05_10 = 
		[2.5328290028164084, 7.8667124994892201e-05, 
		 1.9393061554152005, 0.63216919042222641, 
		 0.82349675792233734, 0.0013309322579473936,
		 0.16789381131174216, 0.53157027704714521, 
		 0.046988491521939582, 0.00029955837915838216,
		 2.4876038159883667, 0.41038859707720432, 
		 0.5070813803303047, 0.46991611584599091,
		 0.43399452759379015, 0.32435082876157251, 
		 0.28813715401225665, 0.0005221007079151274, 
		 4.6832844491449773e-05, 0.31337444779782953];
	
	var r = new Random(1234);
	r.pythonCompatibility = true;
	r.skip = false;
	for (var i = 0; i < 20; i++) {
		assertAlmost(r.gamma(0.5, 1.0), seed1234_05_10[i], 0.000001);
	}
	
	var seed1234_10_10 = [0.034122056303517126, 0.81931693851674714, 
	                      4.8939902312070505, 0.09323876796587531,
	                      0.062653368633307296, 0.54089388867707566, 
	                      0.39814673064728184, 2.477674145470838, 
	                      0.26594545665899949, 1.4404980957300801, 
	                      3.4797854417338829, 0.23727706397407544, 
	                      1.0610594109723921, 0.47275705638684928, 
	                      0.48480755647711316, 1.9068024509822139, 
	                      1.6977739077437124, 2.1679408350578795, 
	                      4.2254482421677517, 0.72000146965058753];
	var r = new Random(1234);
	r.pythonCompatibility = true;
	r.skip = false;
	for (var i = 0; i < 20; i++) {
		assertAlmost(r.gamma(1.0, 1.0), seed1234_10_10[i], 0.000001);
	}
	
	var seed1234_14_10 = [0.036673975980018911, 0.10711224469034528, 
	                      0.87129081080351711, 1.9900307075986401, 
	                      0.4592123648394964, 0.060687695793608276, 
	                      1.5828870226751839, 1.9026275159359096, 
	                      1.7753592184446267, 1.6577173286924805, 
	                      1.3230060874938774, 0.61522984401287073, 
	                      1.2178627345323982, 0.074913320502669203, 
	                      1.2909493527017795, 0.16610714019962003, 
	                      0.41581372600912064, 0.37135082466374025, 
	                      3.459848479953203, 0.36458626969174346];
	var r = new Random(1234);
	r.pythonCompatibility = true;
	r.skip = false;
	for (var i = 0; i < 20; i++) {
		assertAlmost(r.gamma(1.4, 1.0), seed1234_14_10[i], 0.000001);
	}
	
}

function notestArgumentError() {
	var count = 0;
	try { new Random(); } catch (e) { count ++; } // OK
	try { new Random(1.1); } catch (e) { count ++; } // Fail
	try { new Random([1]); } catch (e) { count ++; } // Fail
	try { new Random({a: 1}); } catch (e) { count ++; } // Fail
	try { new Random(1.0); } catch (e) { count ++; } // OK
	try { new Random(1); } catch (e) { count ++; } // OK
	try { new Random("abcd"); } catch (e) { count ++; } // Fail
	try { new Random("1"); } catch (e) { count ++; } // Fail
	
	assertEquals(count, 5);
	
	count = 0;
	var r = new Random();
	try { r.exponential(); } catch (e) { count ++; } // FAIL
	try { r.exponential(1); } catch (e) { count ++; } // OK
	try { r.exponential(1, 2); } catch (e) { count ++; } // FAIL
	
	try { r.gamma(); } catch (e) { count ++; } // FAIL
	try { r.gamma(1); } catch (e) { count ++; } // FAIL
	try { r.gamma(1, 2); } catch (e) { count ++; } // OK
	try { r.gamma(1, 2, 3); } catch (e) { count ++; } // FAIL
	
	try { r.normal(); } catch (e) { count ++; } // FAIL
	try { r.normal(1); } catch (e) { count ++; } // FAIL
	try { r.normal(1, 2); } catch (e) { count ++; } // OK
	try { r.normal(1, 2, 3); } catch (e) { count ++; } // FAIL
	
	try { r.pareto(); } catch (e) { count ++; } // FAIL
	try { r.pareto(1); } catch (e) { count ++; } // OK
	try { r.pareto(1, 2); } catch (e) { count ++; } // FAIL
	
	try { r.triangular(); } catch (e) { count ++; } // FAIL
	try { r.triangular(1); } catch (e) { count ++; } // FAIL
	try { r.triangular(1, 1); } catch (e) { count ++; } // FAIL
	try { r.triangular(1,1,1); } catch (e) { count ++; } // OK
	try { r.triangular(1,1,1,1); } catch (e) { count ++; } // FAIL
	
	try { r.uniform(); } catch (e) { count ++; } // FAIL
	try { r.uniform(1); } catch (e) { count ++; } // FAIL
	try { r.uniform(1,2); } catch (e) { count ++; } // OK
	try { r.uniform(1,2,3); } catch (e) { count ++; } // FAIL
	
	try { r.weibull(); } catch (e) { count ++; } // FAIL
	try { r.weibull(1); } catch (e) { count ++; } // FAIL
	try { r.weibull(1,1); } catch (e) { count ++; } // OK
	try { r.weibull(1,1,1); } catch (e) { count ++; } // FAIL
	
	assertEquals(count, 20);  // ARG CHECK
};