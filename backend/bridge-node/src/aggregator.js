const zmq = require('zeromq');
const WebSocket = require('ws');

// FIREWALL LOGIC: Normalise every incoming payload before routing.
// Handles raw strings, JSON wrappers, Buffers, and case variations.
function normaliseCommand(raw) {
  const str = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
  try {
    const parsed = JSON.parse(str);
    return (parsed.cmd || parsed.command || parsed.type || '').toUpperCase().trim();
  } catch {
    return str.toUpperCase().trim();
  }
}

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
  console.log('[BRIDGE] Aggregator Bridge: ONLINE');
  console.log('[BRIDGE] Streaming: ZMQ:5555 -> WS:8080');
  console.log('[BRIDGE] Commands: WS:8080 -> ZMQ:5556');

  wss.on('connection', (ws) => {
    console.log('[BRIDGE] Frontend UI linked to bridge');

    ws.on('message', async (message) => {
      try {
        const cmd = normaliseCommand(message);
        console.log(`[BRIDGE] Normalised command received: "${cmd}"`);

        // ROUTE 1: Defense Toggles — .includes() for resilience
        if (cmd.includes('DEFENSE_OFF')) {
          console.log('[BRIDGE] Shield Toggle: DEFENSE_OFF');
          await commandPub.send('DEFENSE_OFF');
        } 
        else if (cmd.includes('DEFENSE_ON')) {
          console.log('[BRIDGE] Shield Toggle: DEFENSE_ON');
          await commandPub.send('DEFENSE_ON');
        } 
        
        // ROUTE 2: Attack Termination
        else if (cmd.includes('STOP')) {
          console.log('[BRIDGE] Emergency Stop: Sending STOP signal');
          await commandPub.send('STOP');
        } 
        
        // ROUTE 3: Attack Initiation
        else if (cmd.includes('START')) {
          const attack = cmd.includes('SPOOFING') ? 'SPOOFING' : (cmd.includes('FDI') ? 'FDI' : 'DDOS');
          const targetMatch = cmd.match(/\d+/);
          const target = targetMatch ? targetMatch[0] : '0';

          console.log(`[BRIDGE] Launching Vector: ${attack} on Node ${target}`);
          await commandPub.send(`START_${attack}_${target}`);
        }
      } catch (error) {
        console.error('[BRIDGE] Command Routing Error:', error);
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
  console.error('[BRIDGE] CRITICAL FAILURE:', err);
});