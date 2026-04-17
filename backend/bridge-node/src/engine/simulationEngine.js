// src/engine/simulationEngine.js
const { NodeStatus, EngineParams, edges } = require('../config/gridConfig');

function redistributeLoad(nodes, failedNode) {
  const activeEdges = edges.filter(e => e.target === failedNode.id && e.is_active);
  if (activeEdges.length === 0) return;

  const splitLoad = failedNode.current_load / activeEdges.length;
  activeEdges.forEach(edge => {
    edge.is_active = false;
    const neighbor = nodes.find(n => n.id === edge.source);
    if (neighbor) neighbor.current_load += splitLoad;
  });
  failedNode.current_load = 0;
}

function physicsTick(nodes) {
  for (const node of nodes) {
    if (node.status === NodeStatus.ISOLATED) continue;

    const baseLoad = node.id === 0 ? 20.0 : 30.0;
    node.current_load += node.incoming_packets * 0.05;
    node.incoming_packets = 0; 

    if (node.current_load > baseLoad) {
      node.current_load -= EngineParams.NATURAL_DECAY_RATE;
      if (node.current_load < baseLoad) node.current_load = baseLoad;
    }

    if (node.current_load > node.max_capacity) {
      node.status = NodeStatus.ISOLATED;
      redistributeLoad(nodes, node);
    }
  }
}

module.exports = { physicsTick };