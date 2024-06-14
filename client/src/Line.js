import React from 'react';

const Line = ({ sourceNode, targetNode }) => {
  const sourceX = sourceNode.x + 25;
  const sourceY = sourceNode.y + 25;
  const targetX = targetNode.x + 25;
  const targetY = targetNode.y + 25;

  console.log(`Line: source (${sourceX}, ${sourceY}), target (${targetX}, ${targetY})`);

  return (
    <line
      x1={sourceX}
      y1={sourceY}
      x2={targetX}
      y2={targetY}
      style={{ stroke: 'black', strokeWidth: 2 }}
    />
  );
};

export default Line;