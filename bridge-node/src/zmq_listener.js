const zmq = require("zeromq");

async function startZmqListener(onMessageCallback) {
    const sock = new zmq.Subscriber();
    
    // Connect to the C++ Publisher
    sock.connect("tcp://127.0.0.1:5555");
    sock.subscribe(""); // Listen to all incoming telemetry

    console.log("🔴 ZMQ Subscribed to C++ Engine at tcp://127.0.0.1:5555");

    // Infinite loop listening for C++ data
    for await (const [msg] of sock) {
        onMessageCallback(msg.toString());
    }
}

module.exports = { startZmqListener };