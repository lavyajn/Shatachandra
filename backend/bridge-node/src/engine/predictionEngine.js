// src/engine/predictionEngine.js — Firewall Mode vs Silent Bypass
const { NodeStatus, EngineParams } = require('../config/gridConfig');

// FIREWALL LOGIC: executeSmartDefense
// The AI does NOT shut nodes down. It purges the threat and
// stabilises the node so it stays online — like a real firewall.
function executeSmartDefense(node) {
  console.log(`[AI] Intercept on Node ${node.id} — purging threat`);

  // Drop all malicious packets
  node.incoming_packets = 0;

  // Reset load to safe 70% capacity
  node.current_load = node.max_capacity * 0.70;

  // Restore partial trust — gives time to naturally recover
  node.trust_score = Math.max(50, node.trust_score);

  // WARNING — not ISOLATED. Node stays ONLINE.
  node.status = NodeStatus.WARNING;

  return {
    action: 'FIREWALL_INTERCEPT',
    nodeId: node.id,
    text: `[AI FIREWALL] Threat purged on Node ${node.id} — load stabilised, node online`,
  };
}

function evaluateAndDefend(nodes, edges, currentDecision, state) {
  // FIREWALL LOGIC: Defence is OFF — AI takes zero action.
  // Log the failure for telemetry visibility but do not touch node state.
  // The simulationEngine owns all state changes when defence is bypassed.
  if (!state.isDefenseActive) {
    const failing = nodes.filter(n =>
      n.status !== NodeStatus.ISOLATED &&
      (n.trust_score <= EngineParams.CRITICAL_TRUST ||
       n.current_load > n.max_capacity * 0.9)
    );
    failing.forEach(n =>
      console.log(`[AI BYPASSED] Node ${n.id} failing — trust: ${n.trust_score.toFixed(1)}, load: ${n.current_load.toFixed(1)} — no intervention`)
    );
    return; // Hard exit — nothing else runs
  }

  // DEFENCE ON: evaluate and intercept
  for (const node of nodes) {
    if (node.status === NodeStatus.ISOLATED) continue;

    // 1. Trust Scoring — always runs when defence is active
    if (node.incoming_packets > EngineParams.DDOS_THRESHOLD) {
      node.trust_score -= EngineParams.TRUST_DECAY;
    } else if (node.trust_score < 100.0) {
      node.trust_score += 0.5; 
      if (node.trust_score > 80.0 && node.status === NodeStatus.WARNING) {
        node.status = NodeStatus.NORMAL;
      }
    }
    node.trust_score = Math.max(0, Math.min(100, node.trust_score));

    // 2. Threat Detection — trigger intercept when critical
    const isCompromised = node.trust_score <= EngineParams.CRITICAL_TRUST;
    const isAboutToExplode = node.current_load > node.max_capacity * 0.90;

    if (isCompromised || isAboutToExplode) {
      // Only trigger if node isn't already stabilised (WARNING or NORMAL)
      if (node.status !== NodeStatus.WARNING && node.status !== NodeStatus.NORMAL) {
        const result = executeSmartDefense(node);
        currentDecision.text = result.text;
      } else if (node.status === NodeStatus.WARNING && (isCompromised || isAboutToExplode)) {
        // Re-apply firewall if the node is WARNING but still under heavy attack
        const result = executeSmartDefense(node);
        currentDecision.text = result.text;
      }
    }
  }
}

module.exports = { evaluateAndDefend };