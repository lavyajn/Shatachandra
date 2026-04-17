// src/engine/predictionEngine.js
const { NodeStatus, EngineParams, edges } = require('../config/gridConfig');

function executeSmartDefense(nodes, threatNode) {
  const neighbors = edges
    .filter(e => e.target === threatNode.id && e.is_active)
    .map(e => nodes.find(n => n.id === e.source));

  const cascadeRisk = neighbors.some(n => (n.current_load + (threatNode.current_load / neighbors.length)) > n.max_capacity);

  if (cascadeRisk) {
    threatNode.incoming_packets *= 0.2; 
    return `[PREDICTION] Isolation risk high. Applying Rate Limiting to Node ${threatNode.id}`;
  } else {
    threatNode.status = NodeStatus.ISOLATED;
    threatNode.current_load = 0;
    return `[PREDICTION] Isolation safe. Node ${threatNode.id} isolated.`;
  }
}

function evaluateAndDefend(nodes, currentDecision) {
  for (const node of nodes) {
    if (node.status === NodeStatus.ISOLATED) continue;

    if (node.incoming_packets > EngineParams.DDOS_THRESHOLD) {
      node.trust_score -= EngineParams.TRUST_DECAY;
      node.status = NodeStatus.WARNING;
    } else if (node.trust_score < 100.0) {
      node.trust_score += 0.5; 
      if (node.trust_score > 80.0 && node.status === NodeStatus.WARNING) {
        node.status = NodeStatus.NORMAL;
      }
    }

    if (node.trust_score <= EngineParams.CRITICAL_TRUST && node.status !== NodeStatus.COMPROMISED) {
      node.status = NodeStatus.COMPROMISED;
      currentDecision.text = executeSmartDefense(nodes, node);
    }
  }
}

module.exports = { evaluateAndDefend };