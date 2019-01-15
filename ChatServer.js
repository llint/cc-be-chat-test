const WebSocket = require('ws');

class ChatMessage {
    constructor(msgId, content) {
        this.msgId = msgId;
        this.content = content;
    }
}

class ChatServer {
    constructor() {
        this.wss = new WebSocket.Server({ port: 8080 });
        this.clients = {};
        this.clientIdBase = 0;

        this.messages = {};

        this.histogram = {}; //

        wss.on('connection', function connection(ws) {
            this.clients[++this.clientIdBase] = ws;
            ws.on('message', function incoming(message) {
                console.log('received: %s', message);
                var splitted =
                if (message == "/popular") {
                    //
                } else {
                    var
                }
            });
        });
    }
}

