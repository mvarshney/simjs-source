function Actor(canvas, type, width, height, x, y, color, mood) {
	this.color = color || 'white';
	this.mood = mood || 'none';
	this.canvas = canvas;
	
	switch (type) {
		case 'laptop': this.type = 'laptop'; break;
		case 'server': this.type = 'server'; break;
		case 'rack': this.type = 'rack'; break;
		case 'rect': this.type = 'rect'; break;
		case 'circle': this.type = 'circle'; break;
		default:
			this.type = canvas.image(type, x, y, width, height); 
	}
	
	this.objects = [];
	this.bbox = {x: 0, y: 0, width: 0, height: 0};
	this.move(x, y);
}

Actor.prototype.remove = function() {
	$.each(this.objects, function (id, ob) {
		ob.remove();
	});
};

Actor.prototype.move = function(x, y) {
	this.remove();
	this.x = x;
	this.y = y;
	this.render();
};

Actor.prototype.setMood = function(mood) {
	this.remove();
	this.mood = mood;
	this.render();
};

Actor.prototype.setColor = function(color) {
	this.remove();
	this.color = color;
	this.render();
};

Actor.prototype.getBBox = function() {
	return this.bbox;
};

Actor.prototype.show = function() {
	$.each(this.objects, function (id, ob) {
		ob.show();
	});
};

Actor.prototype.hide = function() {
	$.each(this.objects, function (id, ob) {
		ob.hide();
	});
};


Actor.prototype.render = function(x, y) {
	var cs = this.canvas,
		x = this.x,
		y = this.y,
		o1, o2, o3, o4, o5;

	
	if (this.type === 'rect') {
		var b = 2, a = 2*b+18;
		x -= a/2; y -= a/2;
		o1 = cs.rect(x, y, a, a).attr({fill: 'white'});
		o2 = cs.rect(x+b, y+b, a-2*b, a-2*b)
			.attr({fill: this.color, stroke: 'gray'});
		if (this.mood && this.mood !== 'none') {
			o3 = cs.image('images/moods/face-' + this.mood + '.svg', x-4, y-8, 32, 32);
		}
		
		this.bbox.x = x; this.bbox.y = y; this.bbox.width = a; this.bbox.height = a;
		this.objects = [o1, o2, o3];
		return;
	}
	
	if (this.type === 'circle') {
		var r = 12;
		o1 = cs.circle(x, y, r).attr({fill: this.color, stroke: 'gray', 'stroke-width': 2});
		if (this.mood && this.mood !== 'none') {
			o2 = cs.image('images/moods/face-' + this.mood + '.png', x-r-2, y-r-6, 32, 32);
		}
		this.bbox.x = x-r; this.bbox.y = y-r; 
		this.bbox.width = 2*r; this.bbox.height = 2*r;
		this.objects = [o1, o2];
		return;
	}
	
	if (this.type === 'laptop') {
		var g = 20, b=g/4, h = 2;
		x -= g/2 + b/2 + h;
		y -= g/2 + b + h/2;

		cs.rect(x-h, y-h, g+2*h, g+2*h).attr({fill: 'white'});
		cs.rect(x, y, g, g).attr({fill: this.color, stroke: 'gray'});
		cs.path(['M', x-h, y+g+h, 
					'L', x-h-b, y+g+2*b, 
					x+g+h+b, y+g+2*b, 
					x+g+h, y+g+h, 'Z'].join(','))
			.attr({fill: this.color});
		cs.rect(x-h-b, y+g+2*b, g+2*b+2*h, b/2).attr({fill: 'black'});
		cs.path(['M', x, y+g+2.3*h, 'H', x+g,
				'M', x-h, y+g+3.2*h, 'H', x+g+h,].join(','))
			.attr({stroke: 0.5});

		if (this.mood && this.mood !== 'none') {
			cs.image('images/moods/face-' + this.mood + '.svg', x-4, y-8, 32, 32);
		}
		
		return;
	}
	
	if (this.type === 'server') {
		var h=40, w=2*h/3, b = 3;
		x -= w/2;
		y -= 6*h/10;
		
		cs.path(['M', x, y,
				'L', x, y+h, x+w, y+h, x+w, y, x+w-w/4, y-h/5, x+w/4, y-h/5, 'Z'].join(','))
			.attr({fill: 'white', 'stroke-width': 0.5})
		cs.rect(x+b, y+b, w-2*b, h-2*b)
		.attr({stroke: 'gray', fill: this.color});
		cs.path(['M', x+b, y, 'L', x+w-b, y, x+w-w/4, y-h/5+b, x+w/4, y-h/5+b, 'Z'].join(','))
			.attr({stroke: 'gray', fill: this.color});
		cs.rect(x+.4*w, y+0.6*h, .4*w, b).attr({stroke: 'none', fill: 'gray'});
		cs.rect(x+.4*w, y+0.7*h, .4*w, b).attr({stroke: 'none', fill: 'gray'});
		cs.rect(x+.4*w, y+0.8*h, .4*w, b).attr({stroke: 'none', fill: 'gray'});						
		
		if (this.mood && this.mood !== 'none') {					
			cs.image('images/moods/face-' + this.mood + '.svg', x , y-6, 32, 32);
		}
		return;
	}
	
	if (this.type === 'rack') {
		var w=24, h=8, b = 2;
		x -= 0.85*w;
		y -= 0.75*h;
	
		cs.path(['M', x, y, 'L', x+.7*w, y-h/2, x+1.7*w, y-h/2, x+w, y].join(','))
		.attr({fill: '90-'+this.color+'-#fff', 'stroke-width': 1, 'stroke': 'gray'});

		cs.path(['M', x+w, y, 'L', x+1.7*w, y-h/2, x+1.7*w, y+h/2, x+w, y+h].join(','))
		.attr({fill: '45-'+this.color+'-#fff', 'stroke-width': 1, 'stroke': 'gray'});

		cs.path(['M', x+1.2*w, y+.5*h, 'L', x+1.6*w, y+0.2*h].join(','))
		.attr({stroke: 'gray', 'stroke-width': 4});

		cs.rect(x, y, w, h).attr({fill: this.color, 'stroke-width': 1, 'stroke': 'gray'});
		if (this.mood && this.mood !== 'none') {
			cs.image('images/moods/face-' + this.mood + '.svg', x+w/4, y-8, 24, 24);
		}
		return;
	}
	
	this.type.attr({
		x: x - this.type.attr('width')/2,
		y: y - this.type.attr('height')/2
	});
	this.bbox = this.type.getBBox();
};



