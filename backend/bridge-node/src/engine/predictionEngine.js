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

/**
 * @param {Array} nodes - Current grid state
 * @param {Object} currentDecision - Reference to the UI log object
 * @param {Boolean} isDefenseActive - The new toggle from your Sidebar
 */
function evaluateAndDefend(nodes, currentDecision, isDefenseActive) {
  for (const node of nodes) {
    if (node.status === NodeStatus.ISOLATED) continue;

    // 1. Trust Scoring Logic
    if (node.incoming_packets > EngineParams.DDOS_THRESHOLD) {
      node.trust_score -= EngineParams.TRUST_DECAY;
      node.status = NodeStatus.WARNING;
    } else if (node.trust_score < 100.0) {
      node.trust_score += 0.5; 
      if (node.trust_score > 80.0 && node.status === NodeStatus.WARNING) {
        node.status = NodeStatus.NORMAL;
      }
    }

    // 2. ATOMIC CLAMP: Trust score $T$ is bounded by $0 \le T \le 100$
    node.trust_score = Math.max(0, Math.min(100, node.trust_score));

    // 3. THE TOGGLE LOGIC
    if (node.trust_score <= EngineParams.CRITICAL_TRUST && node.status !== NodeStatus.ISOLATED) {
      
      if (isDefenseActive) {
        // AI IS ACTIVE: Protect the grid
        if (node.status !== NodeStatus.COMPROMISED) {
          node.status = NodeStatus.COMPROMISED;
          currentDecision.text = executeSmartDefense(nodes, node);
        }
      } else {
        // AI IS DISABLED: Report failure but take NO action
        node.status = NodeStatus.COMPROMISED; // Turns it Red for the user
        currentDecision.text = `⚠️ [CRITICAL] Node ${node.id} trust failure! Defense is OFF — System vulnerability exposed.`;
      }
    }
  }
}

module.exports = { evaluateAndDefend };