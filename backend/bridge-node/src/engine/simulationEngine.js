// src/engine/simulationEngine.js — Cascading Failure via Bleed Logic
const { NodeStatus, EngineParams } = require('../config/gridConfig');

// BLEED LOGIC: Distributes excess load equally across all active
// neighbours connected by an edge. Every tick, the failing node
// injects stress into the grid — neighbour overload triggers their
// own bleed on the next tick, creating a chain reaction.
function bleedOverload(nodes, edges, failingNode) {
  const excessLoad = failingNode.current_load - failingNode.max_capacity;
  if (excessLoad <= 0) return;

  // Find all active neighbours via edge connections
  const neighbourIds = edges
    .filter(e =>
      (e.source === failingNode.id || e.target === failingNode.id) && e.is_active
    )
    .map(e => e.source === failingNode.id ? e.target : e.source);

  const activeNeighbours = nodes.filter(n =>
    neighbourIds.includes(n.id) && n.status !== NodeStatus.ISOLATED
  );

  if (activeNeighbours.length === 0) return;

  const bleedPerNeighbour = excessLoad / activeNeighbours.length;

  activeNeighbours.forEach(neighbour => {
    neighbour.current_load += bleedPerNeighbour;
    console.log(
      `[BLEED] Node ${failingNode.id} → Node ${neighbour.id}: ` +
      `+${bleedPerNeighbour.toFixed(1)} load (total: ${neighbour.current_load.toFixed(1)})`
    );
  });

  // Cap the failing node slightly above max so it continues
  // to bleed every subsequent tick — sustained chain reaction.
  failingNode.current_load = failingNode.max_capacity * 1.05;
}

function physicsTick(nodes, edges) {
  for (const node of nodes) {
    if (node.status === NodeStatus.ISOLATED) continue;

    // Base load gravity + packet conversion
    const baseLoad = node.id === 0 ? 20.0 : 30.0;
    node.current_load += node.incoming_packets * 0.05;
    node.incoming_packets = 0;

    // Natural decay toward base load
    if (node.current_load > baseLoad) {
      node.current_load -= EngineParams.NATURAL_DECAY_RATE;
      if (node.current_load < baseLoad) node.current_load = baseLoad;
    }

    // Trust decay when load is high and no defence intervention
    if (node.current_load > node.max_capacity * 0.8 && node.trust_score > 0) {
      node.trust_score -= 1.0;
      if (node.trust_score < 0) node.trust_score = 0;
    }

    // OVERLOAD: Node does NOT isolate. It becomes COMPROMISED
    // and bleeds its excess load to connected neighbours every tick.
    if (node.current_load > node.max_capacity) {
      node.status = NodeStatus.COMPROMISED; // Status 2 — not ISOLATED (3)
      bleedOverload(nodes, edges, node);
      // Node stays active — it will keep bleeding until
      // neighbours also overload, creating cascading failure.
    }
  }
}

module.exports = { physicsTick };