// src/config/gridConfig.js

const NodeStatus = { NORMAL: 0, WARNING: 1, COMPROMISED: 2, ISOLATED: 3 };

const EngineParams = {
  TRUST_DECAY: 5.0,
  CRITICAL_TRUST: 30.0,
  DDOS_THRESHOLD: 500,
  NATURAL_DECAY_RATE: 1.5,
};

function createNodes() {
  return [
    { id: 0, current_load: 20.0, max_capacity: 100.0, trust_score: 100.0, incoming_packets: 0, status: NodeStatus.NORMAL, position3D: { x: 0, y: 0, z: -8 } },
    { id: 1, current_load: 30.0, max_capacity: 80.0,  trust_score: 100.0, incoming_packets: 0, status: NodeStatus.NORMAL, position3D: { x: -6, y: 0, z: -2 } },
    { id: 2, current_load: 40.0, max_capacity: 90.0,  trust_score: 100.0, incoming_packets: 0, status: NodeStatus.NORMAL, position3D: { x: 6, y: 0, z: -2 } },
    { id: 3, current_load: 15.0, max_capacity: 50.0,  trust_score: 100.0, incoming_packets: 0, status: NodeStatus.NORMAL, position3D: { x: 4, y: 0, z: 6 } },
    { id: 4, current_load: 35.0, max_capacity: 85.0,  trust_score: 100.0, incoming_packets: 0, status: NodeStatus.NORMAL, position3D: { x: -4, y: 0, z: 6 } },
  ];
}
// Exported as a let so the physics engine can mutate it if an edge trips
let edges = [
  { id: 0, source: 0, target: 1, is_active: true },
  { id: 1, source: 1, target: 2, is_active: true },
  { id: 2, source: 2, target: 3, is_active: true },
  { id: 3, source: 1, target: 4, is_active: true },
];

module.exports = { NodeStatus, EngineParams, createNodes, edges };