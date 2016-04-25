var ipc = require('ipc');
window.$ = window.jQuery = require('./jquery.min.js');

ipc.on('ping', function(data) {
	txtUpdate(data);
});

ipc.on('setup', function(data){
	animationTime = (data * 100)/2;
});

var singnouns = [
    "smell",
    "mind",
    "spit",
    "skin",
    "liver",
    "gland",
    "throat",
    "gut",
    "spine",
    "mouth",
    "heart",
    "water",
    "space",
    "hair",
    "fluid",
    "pulse",
    "drum",
    "mud",
    "face",
    "reflex",
    "mask",
    "heat",
    "fur",
    "flag",
    "field",
    "way",
    "vein",
    "mark",
    "crack",
    "interior",
    "burn",
    "reservoir",
    "point"
];

var plurnouns = [
    "nails",
    "joints",
    "synapses",
    "cavities",
    "deficits",
    "veins",
    "follicles",
    "ovaries",
    "senses",
    "aches",
    "sounds",
    "memories",
    "eyes"
];

var adjectives = [
    "white",
    "black",
    "colorless",
    "emotionless",
    "unwanted",
    "unforgotten",
    "unforgiving",
    "promised",
    "grief-stricken",
    "desirable",
    "dramatic",
    "quiet",
    "moist",
    "deep",
    "clear",
    "thirsty",
    "doubtful",
    "loud",
    "frozen",
    "disconnected",
    "crushed",
    "cored",
    "spun"
];

var verbs = [
    "saw",
    "was",
    "read",
    "marked",
    "caused",
    "cursed",
    "inhaled",
    "exhaled",
    "heard",
    "bled",
    "unmade",
    "hid"
];

//nountype: 0 is singular, 1 is plural, 2 is either
//placement: 0 is start, 1 is end, 2 is POS in order
var phrases = [
    {value: "missing ", secvalue: "", noun: 1, verb: 0, adjective: 0, nounType: 2, placement: 1},
    {value: " without an interior", secvalue: "", noun: 1, verb: 0, adjective: 0, nounType: 0, placement: 0},
    {value: " surroundings", secvalue: "", noun: 0, verb: 0, adjective: 1, nounType: 0, placement: 0},
    {value: "washing off ", secvalue: "", noun: 1, verb: 0, adjective: 0, nounType: 1, placement: 1},
    {value: "I ", secvalue: " it", noun: 0, verb: 1, adjective: 0, nounType: 1, placement: 1},
    {value: " wasting", secvalue: "", noun: 1, verb: 0, adjective: 0, nounType: 2, placement: 0},
    {value: " , ", secvalue: "", noun: 1, verb: 0, adjective: 1, nounType: 2, placement: 2},
    {value: "It fell through the ", secvalue: "", noun: 1, verb: 0, adjective: 0, nounType: 2, placement: 1},
    {value: "A shrunken ", secvalue: "", noun: 1, verb: 0, adjective: 0, nounType: 0, placement: 1},
    {value: "Felt, Known, ", secvalue: "", noun: 0, verb: 0, adjective: 1, nounType: 0, placement: 1}
];

var phraseCount = 50;

var oallht;
var oallwth;
var oallctr;
var useOverlay = false;
var lightnessmod = 1.2;
var animationTime = 400;
var baseSensor = 0;
var maxSensor = 300;
var vocab = [];
function initText(){
	setOalls();
	txtMake($('#statement'));
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function ratioIfy(baseMax, value){
	return value/baseMax;
}

function invRatioIfy(baseMax, value){
	return 1.0 - value/baseMax;
}

function setOalls(){
	 oallht = $(window).height();
	 oallwth = $(window).width(); 
	 oallctr = {x: (oallwth/2), y: (oallht/2) };
}

function fabPhrase(phraseindex){
    var currentPhrase = phrases[phraseindex]
    var currentFlair = [];
    var noun;
    var verb;
    var adjective;
    var finalPhrase = currentPhrase.value;
    
    switch(currentPhrase.noun) {
        case 0:
            break;
        case 1:
            switch(currentPhrase.nounType) {
                case 0:
                    currentFlair.push(singnouns[randomInt(0, singnouns.length-1)]);
                    break;
                case 1:
                    currentFlair.push(plurnouns[randomInt(0, plurnouns.length-1)]);
                    break;
                case 2:
                    if(Math.random() > 0.5){
                        currentFlair.push(singnouns[randomInt(0, singnouns.length-1)]);
                    }
                    else{
                        currentFlair.push(plurnouns[randomInt(0, plurnouns.length-1)]);
                    }
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }
    
    switch(currentPhrase.verb) {
        case 0:
            break;
        case 1:
            currentFlair.push(verbs[randomInt(0, verbs.length-1)]);
            break;
        default:
            break;
    }
    
    switch(currentPhrase.adjective) {
        case 0:
            break;
        case 1:
            currentFlair.push(adjectives[randomInt(0, adjectives.length-1)]);
            break;
        default:
            break;
    }
    
    switch(currentPhrase.placement){
        case 0:
            if(currentFlair){
                finalPhrase = currentFlair[0] + finalPhrase;    
            }
            break;
        case 1:
            if(currentFlair){
                finalPhrase = finalPhrase + currentFlair[0];    
            }
            break;
        case 2:
            if(currentFlair.length > 1){
                finalPhrase = currentFlair[0] + finalPhrase + currentFlair[1];    
            }
            break;
    }
    if(currentPhrase.secvalue){
        finalPhrase += currentPhrase.secvalue;
    }
    if(!finalPhrase) finalPhrase = "Run,";
    return finalPhrase;
}

function txtMake(){
    var host = $('#host');
	var $targetdiv = $("<div>", {class: "target"});
    var i;
	for(i=0; i<phraseCount; i++){
        var ind = randomInt(0, (phrases.length-1));
		$targetdiv.append('<span class="glyph"> ' + fabPhrase(ind) + '</span>');
	}
	host.parent().append($targetdiv);
}

//TODO: word swapping with transitions, occurring based on sensor reading.
function txtUpdate(sensorReading){
    //console.log(sensorReading);
    var chance = ratioIfy(maxSensor, sensorReading);

	$('.glyph').each(function( index ) {
		if(Math.random() < chance){
            var colorrng = Math.random();
			var ind = randomInt(0, (phrases.length-1));
            var red = 255-(colorrng * 245);
		    var green = 255-(colorrng * 255);
		    var blue = 255-(colorrng * 235);
		    var mycolor = 'rgb('+ Math.round(red) + ','+ Math.round(green) + ','+ Math.round(blue) + ')';
			var atime = animationTime - randomInt(1, (animationTime/3));
            var mymargin = Math.random() * 20;
			$(this).animate({
				opacity: 0.0
			}, atime, function(){
                $(this).css({
                    color : mycolor
                });
				$(this).text(fabPhrase(ind));
				$(this).animate({
					opacity: 1.0
				}, atime);
			});
		}
	});
}

$(function(){
 ipc.send('did-finish-load');
 initText();
});

document.onkeypress = function (e) {
    e = e || window.event;
    //alert("key pressed!");
    ipc.send('pump-test', '');
};