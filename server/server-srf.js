var sys = require('util'), fs = require('fs');
// SERVER
var ws = require('ws').Server;
var server = new ws({port: 8080});
clients = [];
// OPENCV
var cv = require('opencv');
// instantiation
var camera = new cv.VideoCapture(0);
// rectangle de selection transmis par la page au server
var x,y,w,h;
// face detection properties
var rectColor = [0, 255, 0]; // couleur rectangle trace par opencv lors detection de visage p.ex.
var rectThickness = 2; 		 // epaisseur
var refreshrate = 100; 		 // en ms

// connection des clients au server
server.on("connection", function(websocket) {
    clients.push(websocket);
    console.log('>> nombre de clients: '+clients.length);
	
	// reception de msg et renvoi aux client
    websocket.on('message', function(data) {
		// split des coordonnees de selection
		try {
			var array = data.split(','); 
			x = parseInt(array[0])>0?array[0]:-1; 
			y = parseInt(array[1])>0?array[1]:-1; 
			w = parseInt(array[2])>0?array[2]:-1; 
			h = parseInt(array[3])>0?array[3]:-1;
		} catch (e){
			console.error("Erreur parse coordonnees de selection:", e)
		}
		// affiche les coordonnees de la selection si c'en est une (pas un simple click sans drag dans canvas)
		if(parseInt(x)>0 && parseInt(y)>0 && parseInt(w)>0 && parseInt(h)>0)
			console.log('>> [SELECTION]: x='+x+' y='+y+' width='+w+' height='+h);
		// envoi de data si reception d'1 message provenant de la page
		/*for (var i = 0; i < clients.length; i++) { 
			for (var i = 0; i < clients.length; i++) { // envoie a tous les clients connectes
				clients[i].send(data);
			}
		}*/
    });
	// Traitement image: opencv
	try {	
		setInterval(function() {
			try {
				camera.read(function(err, im) {
					try {
						if (im.size()[0] > 0 && im.size()[1] > 0){ // si image webcam coherente
							try {
								// flip image de la cam
								imfh=im.flip(1);
								// si selection sur le canvas presente/coherente
								if (parseInt(x)>0 && parseInt(y)>0 && parseInt(w)>0 && parseInt(h)>0) { 
									// imcrop va contenir la selection "surveillée" (reactualisee tous les 'refreshrate' tant que presente sur le canvas)
									imcrop = imfh.crop(parseInt(x), parseInt(y), parseInt(w), parseInt(h));
									// imcrop save dans c:\Users\<user name>\outcrop.jpg toutes les 'refreshrate' millisecondes
									imcrop.save('\outcrop.jpg'); 
								}
								// detection des visages -------------------------------------------------------------------------
								/*imfh.detectObject(cv.FACE_CASCADE, {}, function(err, faces) {
									if (err) throw err;
									try {
										for (var i = 0; i < faces.length; i++) {
											face = faces[i];
											imfh.rectangle([face.x, face.y], [face.width, face.height], rectColor, rectThickness);
										}
										// envoi de l'image retraitée par OpenCV au client 0
										clients[0].send(imfh.toBuffer());
									} catch (e){
										console.error("Erreur [Opencv] reconnaissance faciale: ", e)
									}
								});*/ // -------------------------------------------------------------------------------------------
								clients[0].send(imfh.toBuffer());
							} catch (e){
								console.error("Erreur [Opencv] traitements de l'image: ", e)
							}
						}
					} catch (e){
						console.error("Erreur [Opencv] cam img size: ", e)
					}
				});
			} catch (e){
				console.error("Erreur [Opencv] camera.read: ", e)
			}
		}, refreshrate);
	} catch (e){
	  console.error("Erreur [Opencv] setInterval: ", e)
	}
    // server close - deconnection des clients
    websocket.on('close', function() {
        console.error('close');
		camera.release()
        for (var i = 0; i < clients.length; i++) {
            if (clients[i] == websocket) {
                clients.splice(i);
                break;
            }
        }
    });
});

console.log('>> Listening on port 8080');
