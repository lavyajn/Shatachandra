// server.js — Express + Socket.IO Server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { createInitialNodes, createInitialEdges } = require('./gridConfig');
const { startAttack, stopAttack } = require('./attackEngine');
const simulation = require('./simulationEngine');

const PORT = 4000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173']
}));
app.use(express.json());

// Initialize simulation
const initialNodes = createInitialNodes();
const initialEdges = createInitialEdges();

function emitToAll(event, data) {
  io.emit(event, data);
}

simulation.init(initialNodes, initialEdges, emitToAll);
simulation.start();

// ============ REST ENDPOINTS ============

/**
 * GET /api/state — Full current grid state snapshot
 */
app.get('/api/state', (req, res) => {
  try {
    const state = simulation.getState();
    res.json(state);
  } catch (error) {
    console.error('Error getting state:', error);
    res.status(500).json({ error: 'Failed to retrieve state' });
  }
});

/**
 * POST /api/attack/start — Start an attack on a node
 * Body: { nodeId: "B", attackType: "fdi" }
 */
app.post('/api/attack/start', (req, res) => {
  try {
    const { nodeId, attackType } = req.body;

    if (!nodeId || !attackType) {
      return res.status(400).json({ success: false, error: 'Missing nodeId or attackType.' });
    }

    const nodes = simulation.getNodes();
    const result = startAttack(nodes, nodeId, attackType);

    if (!result.success) {
      const statusCode = result.error.includes('does not exist') ? 400
        : result.error.includes('already under') ? 409
        : result.error.includes('Cannot attack isolated') ? 403
        : 400;
      return res.status(statusCode).json(result);
    }

    // Emit log
    if (result.log) {
      io.emit('grid:log', result.log);
    }

    res.json(result);
  } catch (error) {
    console.error('Error starting attack:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * POST /api/attack/stop — Stop an attack on a node
 * Body: { nodeId: "B" }
 */
app.post('/api/attack/stop', (req, res) => {
  try {
    const { nodeId } = req.body;

    if (!nodeId) {
      return res.status(400).json({ success: false, error: 'Missing nodeId.' });
    }

    const nodes = simulation.getNodes();
    const result = stopAttack(nodes, nodeId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    if (result.log) {
      io.emit('grid:log', result.log);
    }

    res.json(result);
  } catch (error) {
    console.error('Error stopping attack:', error);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

/**
 * POST /api/reset — Reset entire simulation
 */
app.post('/api/reset', (req, res) => {
  try {
    const freshNodes = createInitialNodes();
    const freshEdges = createInitialEdges();
    simulation.reset(freshNodes, freshEdges);
    io.emit('grid:reset', {});
    res.json({ success: true, message: 'Simulation reset successfully.' });
  } catch (error) {
    console.error('Error resetting simulation:', error);
    res.status(500).json({ success: false, error: 'Failed to reset simulation.' });
  }
});

// ============ SOCKET.IO ============

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send initial state on connection
  socket.emit('grid:state', simulation.getState());

  // Attack start via socket
  socket.on('attack:start', ({ nodeId, attackType }) => {
    const nodes = simulation.getNodes();
    const result = startAttack(nodes, nodeId, attackType);
    if (result.success && result.log) {
      io.emit('grid:log', result.log);
    }
    socket.emit('attack:response', result);
  });

  // Attack stop via socket
  socket.on('attack:stop', ({ nodeId }) => {
    const nodes = simulation.getNodes();
    const result = stopAttack(nodes, nodeId);
    if (result.success && result.log) {
      io.emit('grid:log', result.log);
    }
    socket.emit('attack:response', result);
  });

  // Node isolate
  socket.on('node:isolate', ({ nodeId }) => {
    const result = simulation.isolateNode(nodeId);
    socket.emit('node:response', result);
  });

  // Node restore
  socket.on('node:restore', ({ nodeId }) => {
    const result = simulation.restoreNode(nodeId);
    socket.emit('node:response', result);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ============ START SERVER ============

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║  Smart Grid Cyber Attack Simulation Server       ║
║  Running on http://localhost:${PORT}                ║
║  Socket.IO enabled                               ║
║  Simulation tick: 500ms                           ║
╚══════════════════════════════════════════════════╝
  `);
});
