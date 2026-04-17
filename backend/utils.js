// utils.js — Helper functions

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomDrift(base, percent) {
  const drift = base * (percent / 100);
  return (Math.random() * 2 - 1) * drift;
}

function getNeighborIds(nodeId, edges) {
  const neighbors = [];
  for (const edge of edges) {
    if (edge.source === nodeId) neighbors.push(edge.target);
    if (edge.target === nodeId) neighbors.push(edge.source);
  }
  return neighbors;
}

function getNodeById(nodes, id) {
  return nodes.find(n => n.id === id);
}

function formatTimestamp(date) {
  return date ? new Date(date).toISOString() : new Date().toISOString();
}

function createLogEntry(message, level = "info") {
  return {
    timestamp: new Date().toISOString(),
    message,
    level // "info" | "warn" | "error" | "success"
  };
}

module.exports = {
  clamp,
  randomDrift,
  getNeighborIds,
  getNodeById,
  formatTimestamp,
  createLogEntry
};
