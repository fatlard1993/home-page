const WebSocket = require('uws');

const Log = require(process.env.DIST ? `../_log` : `../../../swiss-army-knife/js/_log`);

var Sockets = {
	init: function(server){
		Sockets.wss = new WebSocket.Server({ server });

		Sockets.wss.on('connection', function(socket){
			Log()('socket', '"Someone" connected...');

			// socket.send(`{ "command": "challenge_accept" }`);
			socket.send(`{ "command": "challenge" }`);

			var user = {
				connected: false
			};

			socket.onmessage = function(message){
				Log()(message);

				var data = JSON.parse(message.data);

				if(data.command === 'test'){
					Log()('socket', 'test');
				}

				else if(data.command === 'challenge_response'){
					user.connected = true;

					socket.send(JSON.stringify({ command: 'challenge_accept' }));
				}

				if(!user.connected) return Log.warn()('invalid connection message: ', data);

				Log()(data);
			};

			socket.onclose = function(data){
				Log()(data);

				if(data.room === 'app') ControlNet.unsubscribe(user.subscriptionRoom);
			};
		});

		return Sockets;
	},
	sendTo: function(destination, data){
		Log(4)('socket', 'Sending '+ data.command +' to '+ destination);

		data = JSON.stringify(data);

		if(destination === '*') Sockets.wss.broadcast(data);

		else Log.warn(1)('socket', 'Could not find '+ destination);
	}
};

module.exports = Sockets;