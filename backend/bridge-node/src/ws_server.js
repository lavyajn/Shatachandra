const WebSocket = require('ws');

let wss;

// ws_server.js
function startWsServer() {
    wss = new WebSocket.Server({ port: 8080 });
    console.log("🟢 WebSocket Server running on ws://localhost:8080");
    return wss; // MUST ADD THIS LINE
}

function broadcastToReact(data) {
    if (!wss) return;
    
    // Push the JSON string to all connected frontend clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

module.exports = { startWsServer, broadcastToReact };