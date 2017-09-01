/*

Copyright _ 2005, Apple Computer, Inc.  All rights reserved.
NOTE:  Use of this source code is subject to the terms of the Software
License Agreement for Mac OS X, which accompanies the code.  Your use
of this source code signifies your agreement to such license terms and
conditions.  Except as expressly granted in the Software License Agreement
for Mac OS X, no other copyright, patent, or other intellectual property
license or right is granted, either expressly or by implication, by Apple.

*/

var animationTimer = null;
var running = true, isFirstData = true;

// setup() is called when the body of the widget is loaded.  This function places the localized
// strings into the widget.

function load()
{
	if(window.widget) {
		widget.onshow = startAnimation;
		widget.onhide = stopAnimation;
	} else { //in a web browser
		animationTimer = setTimeout("eachSecond()", 0);
	}
		
	//animationTimer = setInterval("updown()", 50);
}

function startAnimation()
{
	if(animationTimer == null) {
		running = true;
		isFirstData = true;
		animationTimer = setTimeout("eachSecond()", 0);
	}
}

function stopAnimation()
{
	running = false;
	animationTimer = null;
}





//return 0 when low and 1 when high
function scaleOnRange(x, l, h)
{
	return (x - l) / (h - l);
}


var scale = 1, dir = .002;

function updown() {
	scale += dir;
	if(scale >= 1) {
		dir *= -1;
		scale = 1;
	}
	if(scale <= 0) {
		dir *= -1;
		scale = 0;
	}
	setPercent(scale);
}

var currentMinute = null, nextMinute = null;
var isGettingData = false, nextRetrySeconds = 0;
var nextDataTriggerTime = (new Date()).getTime() + 60*60*1000;
var numAttempts = 0;

function getNextMinute()
{
	isGettingData = true;
	var minute = getStats(isFirstData);
	
	if(minute) {	//always keep some kind of next minute
		nextMinute = minute;
		if(isFirstData)
			currentMinute = nextMinute;
		//Set the next trigger time to the next minute
		var tmpDate = new Date(nextMinute.serverDate.getTime() + 60*1000);
		tmpDate.setSeconds(0);
		tmpDate.setMilliseconds(0);
		nextDataTriggerTime = tmpDate.getTime();
		numAttempts = 0;
		isFirstData = false;
	} else {
		//3 tries in a minute.  :05 :20 :50
		nextRetrySeconds = 15 * Math.pow(2, numAttempts++);
		if(nextRetrySeconds > 600)
			nextRetrySeconds = 600;
	}
	isGettingData = false;
}


function eachSecond()
{
	var now = new Date();
	//move to server time
	if(nextMinute)
		now.setTime(now.getTime() + nextMinute.timeDeltaS * 1000);
	
	//If it is time to get the data OR there is no data and we aren't fetching
	if(!isGettingData && (now.getTime() > nextDataTriggerTime || (!nextMinute && nextRetrySeconds-- <= 0))) {
	
		currentMinute = nextMinute;
		isGettingData = true;
		setTimeout("getNextMinute()", 0);
	}
	
	if(!currentMinute && nextMinute) {
		setPercent(nextMinute.seconds[0].probability);
	} else if(currentMinute) {
		//build in the extra minute of delay here
		nowSeconds = parseInt(Math.floor(now.getTime() / 1000.0) - 60);
		for(i = 0; i < currentMinute.seconds.length; i++) {
			if(currentMinute.seconds[i].time == nowSeconds)
				break;
		}
		if(i < currentMinute.seconds.length) {
			setPercent(currentMinute.seconds[i].probability);
		} else if(nowSeconds > currentMinute.seconds[currentMinute.seconds.length - 1].time) {
			setPercent(currentMinute.seconds[currentMinute.seconds.length - 1].probability);
		}
	}
	
	if(running) {
		var d = new Date();
		setTimeout("eachSecond()", 1000 - d.getMilliseconds());
	}
}


function setPercent(p)
{
	var	cutoff = [.96, .94, .925, .9, .4, .30, .20, .15, .10, .05, .02];
	var	alpha = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	
	
	
	if(p > cutoff[0]) { //deep blue at 0   blue at .96
		alpha[0] = scaleOnRange(p, cutoff[0], 1);
		alpha[1] = 1;// - alpha[0];		//light blue at cutoff[0]
		
	} else if(p > cutoff[1]) { // light blue at .94
		alpha[1] = scaleOnRange(p, cutoff[1], cutoff[0]);
		alpha[2] = 1;// - alpha[1];
		
	} else if(p > cutoff[2]) { //blue green at .925
		alpha[2] = scaleOnRange(p, cutoff[2], cutoff[1]);
		alpha[3] = 1;// - alpha[2];
		
	} else if(p > cutoff[3]) {	//green at .9
		alpha[3] = scaleOnRange(p, cutoff[3], cutoff[2]);
		alpha[4] = 1;// - alpha[3];
		
	} else if(p > cutoff[4]) { //green from .4 to .9
		alpha[4] = 1;
		
	} else if(p > cutoff[5]) { //green hint of yellow  .33
		alpha[4] = scaleOnRange(p, cutoff[5], cutoff[4]);
		alpha[5] = 1;// - alpha[4];
		
	} else if(p > cutoff[6]) {//yellow light green .27
		alpha[5] = scaleOnRange(p, cutoff[6], cutoff[5]);
		alpha[6] = 1;// - alpha[5];
		
	} else if(p > cutoff[7]) {//yellow micro green .20
		alpha[6] = scaleOnRange(p, cutoff[7], cutoff[6]);
		alpha[7] = 1;// - alpha[6];
		
	} else if(p > cutoff[8]) { // yellow at .15
		alpha[7] = scaleOnRange(p, cutoff[8], cutoff[7]);
		alpha[8] = 1;// - alpha[7];
		
	} else if(p > cutoff[9]) {	//moody yellow-orange at .1
		alpha[8] = scaleOnRange(p, cutoff[9], cutoff[8]);
		alpha[9] = 1;// - alpha[8];
		
	} else if(p > cutoff[10]) { //orange at .05
		alpha[9] = scaleOnRange(p, cutoff[10], cutoff[9]);
		alpha[10] = 1;// - alpha[9];
		
	} else {	//deep red at .02    bright red at 0
		alpha[10] = scaleOnRange(p, 0, cutoff[10]);
		alpha[11] = 1;// - alpha[10];
	}
	
	for(i = 1; i <= 12; i++) {
		//alert('color' + (i < 10?'0':'') + i);
		var button = document.getElementById ('color' + (i < 10?'0':'') + i);
		button.style.opacity = alpha[i-1];
		//alert(button + " " + alpha[i-1]);
	}
	button = document.getElementById ('disconnected');
	button.style.opacity = 0;
}






/**********************************************************************
 *
 *
 var	host = "gcp.djbradanderson.com";
 	This is the old URL that is not working anymore. I changed it to the one below.
 */
 var	host = "global-mind.org/gcpdot/"; //New host
 function getStats(includeCurrentMinute)
 {
 	var url = "http://" + host + "/gcpindex.php?" + (includeCurrentMinute ? "current=1&" : "") + "small=1";
 	
	var req = new XMLHttpRequest();
	req.overrideMimeType("text/xml");
	req.open("GET", url, false); 
	req.send(null); 
	
	if(req.responseXML && req.responseText && req.responseText.length > 128) {
		var minute = new Object();
		minute.serverTime =  req.responseXML.getElementsByTagName("serverTime")[0].firstChild.nodeValue - 5;
		minute.clientDate = new Date();
		
		var seconds =  req.responseXML.getElementsByTagName("s");
		minute.seconds = new Array(seconds.length);
		
		for(i = 0; i < seconds.length; i++) {
			var second = new Object();
			second.time = parseInt(seconds[i].getAttribute("t"));
			second.probability = parseFloat(seconds[i].firstChild.nodeValue);
			minute.seconds[i] = second;
		}
		
		minute.serverDate = new Date();
		minute.serverDate.setTime(minute.serverTime * 1000);
		minute.clientTime = Math.floor(minute.clientDate.getTime() / 1000.0);
		
		minute.timeDeltaS = minute.serverTime - minute.clientTime;
		
		return minute;
	}
	return null;
 }

