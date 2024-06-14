export const initialNodes = [
  { id: 'node1', label: 'Start', x: 100, y: 100 },
  { id: 'node2', label: 'Process', x: 300, y: 100 },
  { id: 'node3', label: 'Decision', x: 500, y: 100 },
  { id: 'node4', label: 'End', x: 700, y: 100 },
];

export const initialEdges = [
  { source: 'node1', target: 'node2' },
  { source: 'node2', target: 'node3' },
  { source: 'node3', target: 'node4' },
];