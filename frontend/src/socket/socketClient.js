// socketClient.js — Socket.IO Client Setup + Event Binding
import { io } from 'socket.io-client';
import useGridStore from '../store/useGridStore';

const SOCKET_URL = 'http://localhost:4000';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 3000,
  reconnectionDelayMax: 10000,
});

// Connection events
socket.on('connect', () => {
  console.log('[Socket] Connected:', socket.id);
  useGridStore.getState().setConnectionStatus('connected');

  // Re-fetch full state on reconnect for full re-sync
  fetch('/api/state')
    .then(res => res.json())
    .then(state => {
      useGridStore.getState().updateFromServer(state);
    })
    .catch(err => console.error('[Socket] Failed to fetch initial state:', err));
});

socket.on('disconnect', () => {
  console.log('[Socket] Disconnected');
  useGridStore.getState().setConnectionStatus('disconnected');
});

socket.on('connect_error', () => {
  useGridStore.getState().setConnectionStatus('disconnected');
});

socket.on('reconnect_attempt', () => {
  useGridStore.getState().setConnectionStatus('connecting');
});

// Grid state updates
socket.on('grid:state', (state) => {
  useGridStore.getState().updateFromServer(state);
});

// Log entries
socket.on('grid:log', (entry) => {
  useGridStore.getState().addLog(entry);
});

// Reset
socket.on('grid:reset', () => {
  useGridStore.getState().resetState();
});

// Catastrophic failure
socket.on('grid:catastrophic_failure', (data) => {
  useGridStore.getState().addLog({
    timestamp: new Date().toISOString(),
    message: '💀 CATASTROPHIC FAILURE — Auto-reset in 5 seconds...',
    level: 'error',
  });
});

// Helper functions
export function emitAttackStart(nodeId, attackType) {
  socket.emit('attack:start', { nodeId, attackType });
}

export function emitAttackStop(nodeId) {
  socket.emit('attack:stop', { nodeId });
}

export function emitNodeIsolate(nodeId) {
  socket.emit('node:isolate', { nodeId });
}

export function emitNodeRestore(nodeId) {
  socket.emit('node:restore', { nodeId });
}

export default socket;
