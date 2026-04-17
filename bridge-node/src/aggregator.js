const zmq = require('zeromq');
const WebSocket = require('ws');

async function runBridge() {
    console.log("=========================================");
    console.log(" SHATACHANDRA TELEMETRY BRIDGE STARTING  ");
    console.log("=========================================");

    // 1. SETUP WEBSOCKET SERVER (Port 8080 - Talks to React)
    const wss = new WebSocket.Server({ port: 8080 });
    console.log("🟢 WebSocket Server running on ws://localhost:8080");

    // 2. SETUP ZMQ SUBSCRIBER (Listens to C++ Telemetry on 5555)
    const telemetrySub = new zmq.Subscriber();
    telemetrySub.connect("tcp://127.0.0.1:5555");
    telemetrySub.subscribe("");
    console.log("🔴 ZMQ Subscribed to C++ Telemetry at tcp://127.0.0.1:5555");

    // 3. SETUP ZMQ PUBLISHER (Sends Attack Commands to C++ on 5556)
    const commandPub = new zmq.Publisher();
    commandPub.connect("tcp://127.0.0.1:5556"); 
    console.log("🔵 ZMQ Publisher connected to C++ Commands at tcp://127.0.0.1:5556");

    // --- HANDLE INBOUND ATTACKS FROM REACT ---
    wss.on('connection', (ws) => {
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                
                // If React sends an attack command, translate it for C++
                if (data.command === "INJECT_ATTACK") {
                    const type = data.payload.type;
                    const target = data.payload.targetNode;
                    
                    // The exact string format main.cpp is waiting for
                    const cmdString = `ATTACK:${type}:${target}`;
                    
                    console.log(`[FORWARDING] React -> C++ : ${cmdString}`);
                    await commandPub.send(cmdString);
                }
            } catch (err) {
                console.error("Failed to parse WebSocket message from React");
            }
        });
    });

    // --- HANDLE OUTBOUND TELEMETRY TO REACT ---
    for await (const [msg] of telemetrySub) {
        const payload = msg.toString();
        
        // Broadcast the C++ JSON to all connected React browser tabs
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    }
}

runBridge().catch(err => {
    console.error("Bridge Error:", err);
    process.exit(1);
});