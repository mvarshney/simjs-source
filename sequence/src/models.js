function crosssitescripting(define, panel, say, send, hide, show, move) {
define('a', 'host', 50, 20, 60)
define('v', 'host', 50, 20, 80)
define('w', 'server', 50, 80, 40)
define('c', 'cookie', 50, 25, 85, 'hidden');

panel("", "", {clear: true});
say('', 'CROSS\n\nSITE\n\nSCRIPTING\n(XSS)', 50, 50, {type: 'none'});

panel("A typical website");
hide('a');
say('w', 'I am webserver.\nI use cookies.', 40, 25, {type: 'none', angles: [0, 180]});
say('v', 'I use that website', 
	30, 50, {type: 'none'});
say('', 'What are cookies?\nSee below\nV', 70, 80, {type: 'rect'});

panel('The attacker');
hide('v');
hide('w')
say('a', 'I am THE attacker.\nI will steal that guy\'s\ndata from the webserver',
	50, 30, {type: 'none', angles: [-90, 30]});
say('a', 'Oh.. did I say I will use\nCROSS SITE SCRIPTING', 
	60, 80, {type: 'none', angles: [130, -30]});

panel("Before we continue: What are cookies?", "", {type: 'banner'});

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
	70, 70, {type: 'rect'});

panel("Subsequent Website access")
hide('a'); show('c');
send('v', 'w', '');
move('c', 35, 45);
say('c', 'Cookie sent each time', 30, 30);
say('w', 'Ah.. its you Mr. Itsme\nRecognized you\nby your cookie!', 
	70, 85, {angles: [90, -90]});


panel('Back to story: First type of cross site scripting', '', {type: 'banner'});
panel();
hide('v'); hide('w');


}

function hadoopwrite() {
define('n', 'host');


}



function dhcpbasics(define, panel, say, send, hide, show, move) {
define("A", "host", 50, 20, 20);
define("B", "host", 50, 10, 40);
define("C", "host", 50, 20, 80);
define("S", "server", 50, 80, 50);

panel("Basics: One DHCP Server and One client", "", {type: 'banner'});
panel();
move("C", 10, 50);
say(["A", "B", "C"], "We are hosts", 
	60, 20, 
	{type: 'cloud', angles: [[180, 0], [225, 0], [270, 0]]});
say("C", "I dont have IP address!", 40, 90, {angles: [90, -90]});
say("", "DHCP Server", 80, 70, {type: 'rect'});

panel("dhcp discover");
send("C", "A", "", 20, 20, {angles: [0, 0]});
send("C", "B", "", 20, 20, {angles: [0, 0]});
send("C", "S", "DHCP_Discover", 80, 70, {angles: [0, 180, 90]});
say("", "Broadcast\nin the subnet", 70, 20);

panel();
hide('C');
hide('S');
send("A", null, "", 40, 30);
send("B", null, "", 30, 60);
say('', "All other hosts will ignore\nthe discovery packet", 
	50, 70, {type: 'cloud', curvy: 20});

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
send('S', "C", "DHCP_Offer 192.168.0.3", 50, 50, {angles: [180, 0]});

panel("dhcp request");
send("C", "A", "", 20, 20, {angles: [0, 0]});
send("C", "B", "", 20, 20, {angles: [0, 0]});
send("C", "S", "DHCP_Request 192.168.0.3", 80, 70, {angles: [0, 180, 90]});
send("A", null);
send("B", null);
say('', 'Also\nbroadcast!', 70, 25, {type: 'none'});

panel();
hide('A'); hide('B'); hide('C');
move('S', 80, 70);
say('', 'Address Table\n192.168.0.1 (used)\n192.168.0.2 (used)\n192.168.0.3 (USED)\n192.168.0.4 (free)\n...',
	30, 50, {type: 'rect'});
say('S', 'One more\naddress gone!', 75, 20);

panel("DHCP Ack");
hide('A'); hide('B');
move('S', 80, 70);
say('S', 'One more happy client!\nI will now start a "lease" timer\nbut more on that some other time', 55, 35, {type: 'none'});
send('S', "C", "DHCP_Ack 192.168.0.3", 50, 50, {angles: [180, 0]});

panel("ARP")
hide('S');
send("C", "A", "", 20, 20, {angles: [0, 0]});
send("C", "B", "Anybody has 192.168.0.3?", 80, 70, {angles: [0, 0, 90]});
send("A", null);
send("B", null);
say('', "Client verifies no\nother host has\nsame IP address\nby using ARP", 
	70, 40, {type: 'none'});
	
panel("Two DHCP Servers. Client must select one of them", "", {type: "banner"});
define('T', 'server', 50, 80, 20);

panel("DHCP Discover");
hide('A', {permanent: true}); hide('B', {permanent: true});
send("C", "T", "", 20, 20, {angles: [0, 180]});
send("C", "S", "DHCP_Discover", 80, 70, {angles: [0, 180, 90]});
say('', 'Reaches both\nservers', 30, 40, {type: 'none'});

panel();
hide('C');
say('T', 'Address Table:\n192.168.0.123 (offered)', 
	35, 20, {type: 'rect', angles: [0, 180]});
say('S', 'Address Table:\n192.168.0.3 (offered)', 
	35, 50, {type: 'rect', angles: [0, 180]});
say('', 'Both servers have selected\none IP address', 60, 80, {type: 'none'});
	
panel('DHCP offer');
send('T', "C", "DHCP_Offer\n192.168.0.123", 25, 30, {angles: [180, 0, 0]});
send('S', "C", "DHCP_Offer\n192.168.0.3", 90, 70, {angles: [180, 0, 90]});

panel("Client selects one address");
send("C", "T", "", 20, 20, {angles: [0, 180]});
send("C", "S", "DHCP_Request 192.168.0.3", 80, 70, {angles: [0, 180, 90]});
send("C", "T", "DHCP_Request 192.168.0.3", 80, 70, {angles: [0, 180, 90]});
say('C', 'I select\n192.168.0.3', 20, 35);

panel()
say('T', 'Address Table:\n192.168.0.123 (FREE)', 
	35, 20, {type: 'rect', angles: [0, 180]});
say('S', 'Address Table:\n192.168.0.3 (USED)', 
	35, 50, {type: 'rect', angles: [0, 180]});
send('S', "C", "DHCP_Ack 192.168.0.3", 80, 70, {angles: [180, 0, 90]});

}