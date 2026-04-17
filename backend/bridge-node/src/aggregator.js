const zmq = require('zeromq');
const WebSocket = require('ws');

async function runAggregator() {
  // 1. ZMQ Setup: Listen to Telemetry (Port 5555)
  const telemetrySub = new zmq.Subscriber();
  telemetrySub.connect('tcp://127.0.0.1:5555');
  telemetrySub.subscribe('');

  // 2. ZMQ Setup: Send Commands to Engine (Port 5556)
  const commandPub = new zmq.Publisher();
  await commandPub.bind('tcp://127.0.0.1:5556'); 

  // 3. WebSocket Setup: Talk to React (Port 8080)
  const wss = new WebSocket.Server({ port: 8080 });
  console.log('📡 Aggregator Bridge: ONLINE');
  console.log('🔗 Streaming: ZMQ:5555 -> WS:8080');
  console.log('🕹️ Commands: WS:8080 -> ZMQ:5556');

  wss.on('connection', (ws) => {
    console.log('🟢 Frontend UI linked to bridge');

    ws.on('message', async (message) => {
      try {
        const cmdRaw = message.toString();
        const cmdUpper = cmdRaw.toUpperCase();

        // ROUTE 1: Defense Toggles (Direct Pass-through)
        if (cmdUpper === "DEFENSE_OFF" || cmdUpper === "DEFENSE_ON") {
          console.log(`[BRIDGE] Shield Toggle: ${cmdUpper}`);
          await commandPub.send(cmdUpper);
        } 
        
        // ROUTE 2: Attack Termination
        else if (cmdUpper.includes('STOP')) {
          console.log(`[BRIDGE] Emergency Stop: Sending STOP signal`);
          await commandPub.send('STOP');
        } 
        
        // ROUTE 3: Attack Initiation
        else if (cmdUpper.includes('START')) {
          const attack = cmdUpper.includes('SPOOFING') ? 'SPOOFING' : (cmdUpper.includes('FDI') ? 'FDI' : 'DDOS');
          const targetMatch = cmdUpper.match(/\d+/);
          const target = targetMatch ? targetMatch[0] : '0';

          console.log(`[BRIDGE] Launching Vector: ${attack} on Node ${target}`);
          await commandPub.send(`START_${attack}_${target}`);
        }
      } catch (error) {
        console.error('[WS] Command Routing Error:', error);
      }
    });
  });

  // 4. Telemetry Loop: Pipe ZMQ data to all connected Browser clients
  for await (const [msg] of telemetrySub) {
    const data = msg.toString();
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

runAggregator().catch(err => {
  console.error('🔴 BRIDGE CRITICAL FAILURE:', err);
});