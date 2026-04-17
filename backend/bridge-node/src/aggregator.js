const { startZmqListener } = require('./zmq_listener');
const { startWsServer, broadcastToReact } = require('./ws_server');

function runBridge() {
    console.log("=========================================");
    console.log(" SHATACHANDRA TELEMETRY BRIDGE STARTING  ");
    console.log("=========================================");

    startWsServer();

    startZmqListener((telemetryString) => {
        try {
            // Parse the C++ payload
            const data = JSON.parse(telemetryString);
            
            // Log a clean readout to the terminal so we can see it working
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