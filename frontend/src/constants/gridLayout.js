// gridLayout.js — 2D positions for graph nodes (numeric IDs matching backend2)
// Arranged in a hexagonal mesh topology for 6 towers
// These positions are used as fallback only — primary positions are derived
// from 3D positions in socketClient.js via project3DTo2D()
export const GRID_2D_POSITIONS = {
  '0': { x: 150, y: 100 },
  '1': { x: 450, y: 100 },
  '2': { x: 550, y: 300 },
  '3': { x: 400, y: 480 },
  '4': { x: 150, y: 450 },
  '5': { x: 50,  y: 270 },
};
