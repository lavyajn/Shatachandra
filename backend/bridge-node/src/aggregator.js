const zmq = require('zeromq');
const WebSocket = require('ws');

async function runAggregator() {
  // 1. Listen to Telemetry from server.js
  const telemetrySub = new zmq.Subscriber();
  telemetrySub.connect('tcp://127.0.0.1:5555');
  telemetrySub.subscribe('');

  // 2. Send Commands to server.js
  const commandPub = new zmq.Publisher();
  // Using bind here so it can act as the host for the engine's subscriber
  await commandPub.bind('tcp://127.0.0.1:5556'); 

  // 3. Talk to React via WebSockets
  const wss = new WebSocket.Server({ port: 8080 });
  console.log('📡 Aggregator Bridge running on ws://localhost:8080');

  wss.on('connection', (ws) => {
    console.log('🟢 Frontend UI connected to bridge');

    // Translate React clicks into ZMQ Engine Commands
    ws.on('message', async (message) => {
      try {
        const cmdText = message.toString().toUpperCase();
        
        if (cmdText.includes('STOP')) {
          await commandPub.send('STOP');
        } else if (cmdText.includes('START')) {
          // Safely extract the attack type and target node number
          const attack = cmdText.includes('SPOOFING') ? 'SPOOFING' : (cmdText.includes('FDI') ? 'FDI' : 'DDOS');
          const targetMatch = cmdText.match(/\d+/);
          const target = targetMatch ? targetMatch[0] : '0';
          
          await commandPub.send(`START_${attack}_${target}`);
        }
      } catch (error) {
        console.error('[WS] Error processing command:', error);
      }
    });
  });

  // Stream the physical node data straight to the 3D Canvas
  for await (const [msg] of telemetrySub) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg.toString());
      }
    });
  }
}

runAggregator().catch(console.error);