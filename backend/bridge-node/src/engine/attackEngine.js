// src/engine/attackEngine.js

function injectAttack(nodes, state) {
  // 1. Baseline Traffic (Always on)
  nodes.forEach(n => {
    if (n.status !== 3) n.incoming_packets += 5; // 3 = ISOLATED
  });

  // 2. Malicious Injection
  if (state.isAttackActive && state.targetNodeId !== null) {
    const target = nodes.find(n => n.id === state.targetNodeId);
    if (target) {
      if (state.activeScenario === 'DDOS') {
        target.incoming_packets += 800;
      } else if (state.activeScenario === 'SPOOFING') {
        target.trust_score -= 2.5;
      } else if (state.activeScenario === 'FDI') {
        target.current_load += 12.0;
      }
    }
  }
}

module.exports = { injectAttack };