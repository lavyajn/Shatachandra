const { startZmqListener } = require('./zmq_listener');
const { startWsServer, broadcastToReact } = require('./ws_server');
const zmq = require("zeromq");

// NEW: Command Bus to send signals TO the C++ Engine (or sim_engine.js)
const cmdPub = new zmq.Publisher();

async function runBridge() {
    console.log("=========================================");
    console.log(" SHATACHANDRA TELEMETRY BRIDGE STARTING  ");
    console.log("=========================================");

    // 1. Initialize the Command Bus on Port 5556
    try {
        await cmdPub.bind("tcp://127.0.0.1:5556");
        console.log("🔵 Command Bus active on tcp://127.0.0.1:5556");
    } catch (err) {
        console.error("[ERROR] Could not bind Command Bus:", err);
    }

    // 2. Start the WebSocket Server and capture the instance to listen for React commands
    const wss = startWsServer(); // Ensure your ws_server.js returns the wss instance

    // 3. Listen for React commands (CONTROL messages)
    if (wss) {
       // bridge-node/aggregator.js
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'CONTROL') {
            if (data.command === 'STOP_ATTACK') {
                cmdPub.send("STOP");
            } else if (data.command === 'START_SCENARIO') {
                // Format: START_TYPE_TARGET (e.g., START_DDOS_2)
                cmdPub.send(`START_${data.scenario}_${data.targetId}`);
            }
        }
    });
});
    }

    // 4. Existing ZMQ Telemetry Listener (C++ -> React)
    startZmqListener((telemetryString) => {
        try {
            const data = JSON.parse(telemetryString);
            
            // Clean readout
            process.stdout.write(`\r[LIVE] Nodes: ${data.nodes.length} | C++ Engine: ${data.decision_log.substring(0, 60).padEnd(60)}`);
            
        } catch (e) {
            console.log("Raw Data:", telemetryString);
        }

        // Send to React
        broadcastToReact(telemetryString);

    }).catch(err => {
        console.error("[ERROR] ZMQ Listener crashed:", err);
    });
}

runBridge();