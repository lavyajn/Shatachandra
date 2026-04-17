// gridConfig.js — Grid Topology & Node Definitions
// 5 grid nodes (A–E) with 7 edges forming a ring with cross-links

function project3DTo2D(position3D) {
  return {
    x: 350 + position3D.x * 25,
    y: 250 + position3D.z * 20
  };
}

function createInitialNodes() {
  const nodes = [
    {
      id: "A",
      label: "Substation Alpha",
      position3D: { x: -7, y: 0, z: -7 },
      capacity: 100,
      baseLoad: 45,
      currentLoad: 45,
      displayedLoad: 45,
      trueLoad: 45,
      status: "normal",
      packetRate: 120,
      basePacketRate: 120,
      maliciousPacketRate: 0,
      attackActive: false,
      attackType: null,
      attackStartTime: null,
      predictedLoad: null,
      predictedRisk: "low",
      timeToFailure: null,
      responseActions: [],
      decisionLog: [],
      history: {
        load: [],
        packetRate: [],
        maliciousRate: []
      }
    },
    {
      id: "B",
      label: "Substation Beta",
      position3D: { x: 8, y: 0, z: -6 },
      capacity: 120,
      baseLoad: 55,
      currentLoad: 55,
      displayedLoad: 55,
      trueLoad: 55,
      status: "normal",
      packetRate: 150,
      basePacketRate: 150,
      maliciousPacketRate: 0,
      attackActive: false,
      attackType: null,
      attackStartTime: null,
      predictedLoad: null,
      predictedRisk: "low",
      timeToFailure: null,
      responseActions: [],
      decisionLog: [],
      history: {
        load: [],
        packetRate: [],
        maliciousRate: []
      }
    },
    {
      id: "C",
      label: "Substation Gamma",
      position3D: { x: 10, y: 0, z: 2 },
      capacity: 90,
      baseLoad: 40,
      currentLoad: 40,
      displayedLoad: 40,
      trueLoad: 40,
      status: "normal",
      packetRate: 100,
      basePacketRate: 100,
      maliciousPacketRate: 0,
      attackActive: false,
      attackType: null,
      attackStartTime: null,
      predictedLoad: null,
      predictedRisk: "low",
      timeToFailure: null,
      responseActions: [],
      decisionLog: [],
      history: {
        load: [],
        packetRate: [],
        maliciousRate: []
      }
    },
    {
      id: "D",
      label: "Substation Delta",
      position3D: { x: 3, y: 0, z: 9 },
      capacity: 110,
      baseLoad: 50,
      currentLoad: 50,
      displayedLoad: 50,
      trueLoad: 50,
      status: "normal",
      packetRate: 130,
      basePacketRate: 130,
      maliciousPacketRate: 0,
      attackActive: false,
      attackType: null,
      attackStartTime: null,
      predictedLoad: null,
      predictedRisk: "low",
      timeToFailure: null,
      responseActions: [],
      decisionLog: [],
      history: {
        load: [],
        packetRate: [],
        maliciousRate: []
      }
    },
    {
      id: "E",
      label: "Substation Epsilon",
      position3D: { x: -8, y: 0, z: 6 },
      capacity: 95,
      baseLoad: 42,
      currentLoad: 42,
      displayedLoad: 42,
      trueLoad: 42,
      status: "normal",
      packetRate: 110,
      basePacketRate: 110,
      maliciousPacketRate: 0,
      attackActive: false,
      attackType: null,
      attackStartTime: null,
      predictedLoad: null,
      predictedRisk: "low",
      timeToFailure: null,
      responseActions: [],
      decisionLog: [],
      history: {
        load: [],
        packetRate: [],
        maliciousRate: []
      }
    }
  ];

  return nodes.map(node => ({
    ...node,
    position2D: project3DTo2D(node.position3D)
  }));
}

function createInitialEdges() {
  return [
    { id: "A-B", source: "A", target: "B", baseCapacity: 80, currentFlow: 30, stressed: false },
    { id: "A-C", source: "A", target: "C", baseCapacity: 70, currentFlow: 25, stressed: false },
    { id: "B-C", source: "B", target: "C", baseCapacity: 75, currentFlow: 28, stressed: false },
    { id: "B-D", source: "B", target: "D", baseCapacity: 85, currentFlow: 32, stressed: false },
    { id: "C-D", source: "C", target: "D", baseCapacity: 65, currentFlow: 22, stressed: false },
    { id: "C-E", source: "C", target: "E", baseCapacity: 60, currentFlow: 20, stressed: false },
    { id: "D-E", source: "D", target: "E", baseCapacity: 70, currentFlow: 24, stressed: false }
  ];
}

module.exports = { createInitialNodes, createInitialEdges };
