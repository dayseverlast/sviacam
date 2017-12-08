window.onload = function (e) {
    // INIT 
	var canvas     = document.getElementById('cvs');
	var context    = canvas.getContext('2d');
	var canvas2    = document.getElementById('cvs2');
	var context2   = canvas2.getContext('2d');
    var video 	   = document.getElementById('myVideo');
	document.querySelector('video').style.visibility = 'hidden'; // cache la video
	// WS
	var ws;
	// mouse
	var state      = null;
	var translated = false;
	var mousedown  = false;         
	
	// Translation pour l'antialiasing 
	if (!translated) {
		context.translate(0.5,0.5);
		translated = true;
	}
	// WEBCAM -------------------------------------------------------------------------------------------------------------------------------
	// Affiche la Webcam
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
	if (navigator.getUserMedia) {
		navigator.getUserMedia({video: true, audio: false}, onSuccessCallbck, onErrorCallBck);
		function onSuccessCallbck(stream) {
			video.srcObject = stream;
			video.play();
		}
		function onErrorCallBck(err) {
			var msg = 'Cause d\'erreur: ' +err.code;
			console.error(msg);
			alert(msg);
			return;
		}
	} else {
		alert("Probleme avec getUserMedia()");
		return;
	}
	// Dessine le canvas a partir de la video
	function drawOnCanvas(obj, context) {
		window.setInterval(function() {
			context.drawImage(obj, 0, 0);
		}, 60);
	}
	// Listener declenche par la lecture de la video 
	video.addEventListener('play', function() {
		drawOnCanvas(this, context);
		// Flip horizontal de la video
		context.translate(canvas.width, 1);
		context.scale(-1, 1);
	}, false);
	
	// Connection au WS ---------------------------------------------------------------------------------------------------------------------
	if ('WebSocket' in window) {
		connect('ws://127.0.0.1:8080/');
		console.log('Page web en cours de connection au webservice ..');
	} else {
		console.log('web sockets not suported');
	}
	
	// RECTANGLE DE SELECTION ---------------------------------------------------------------------------------------------------------------
	function Draw() {
		// CLEAR les deux CANVAS d'une précédente SELECTION
		context.clearRect(0,0,canvas.width,canvas.height);
		context2.clearRect(0,0,canvas2.width,canvas2.height);
		// AFFICHE la VIDEO sur le PREMIER CANVAS
		context.drawImage(video,0,0);
		// AFFICHE la SELECTION sur le deuxieme CANVAS
		if (state && state.x && state.y && state.w && state.h) {
			context2.drawImage(canvas,state.x,state.y,state.w,state.h,0,0,canvas2.width,canvas2.height);
		}
		// AFFICHE la SELECTION si presente
		if (state) {
			if (context.setLineDash) context.setLineDash([3,3]);
			context.lineWidth = 2;
			context.strokeStyle = 'red'
			context.strokeRect(canvas.width-state.x, state.y, -state.w, state.h); // avec flip horizontal
			if (context.setLineDash) context.setLineDash([1]);
		}
		setTimeout(Draw, 1000 / 60);
	}
	
	// MOUSE events -------------------------------------------------------------------------------------------------------------------------
	// mousedown - debut du tracé du rectangle
	canvas.onmousedown = function (e) {
		var mouseXY = RGraph.getMouseXY(e);
		state = {x: mouseXY[0], y:mouseXY[1]};
		mousedown = true;
	}
	// mouseup - termine le rectangle de selection
	window.onmouseup = canvas.onmouseup = function (e) {
		if (state) {
			var x = state.x;
			var y = state.y;
			var w = state.w;
			var h = state.h;
		}
		mousedown = false;
	}
	// mousemove - refresh le rectangle de selection
	canvas.onmousemove = function (e) {
		if (state && mousedown) {
			var mouseXY = RGraph.getMouseXY(e);
			state.w = mouseXY[0] - state.x;
			state.h = mouseXY[1] - state.y;
		}
	}
	// WEBSERVICE ---------------------------------------------------------------------------------------------------------------------------
	function connect(host) {
		ws = new WebSocket(host);
		ws.onopen = function () {
			console.log('Page web connectee au webservice ..');
			send('Page web connectee au webservice ..');
		}
		ws.onclose = function () {
			console.log('connection au ws closed ..');
		}
		ws.onerror = function(evt) {
			console.log('<span style="color: red;">ERROR:</span> ' + evt.data);
		}
	}
	
	function send(msg) {
		if (ws != null) {
			if (ws.readyState === 1)
				ws.send(msg);
		} else {
			console.log('not ready yet');
		}
	}
	// BUTTONS ------------------------------------------------------------------------------------------------------------------------------
	// Action button "ordreOne" pressé
	document.getElementById("ordreOne").onclick = function (e) {
		send('Bouton ordreOne clické ...');
	}
	// Action button "ordreTwo" pressé
	document.getElementById("ordreTwo").onclick = function (e) {
		send('Bouton ordreTwo clické ...');
	}
	// --------------------------------------------------------------------------------------------------------------------------------------
	// DESSINE a 60fps
	setTimeout(Draw, 1000 / 60);
}