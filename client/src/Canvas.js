import React from 'react';
import Line from './Line';

const Canvas = ({ nodes, edges, onDrop }) => {
  const handleNodeClick = () => {
    console.log('Node clicked');
  };

  return (
    <div className="canvas" style={{ position: 'relative', width: 500, height: 500, border: '1px solid black' }}>
      {nodes.map((node) => (
        <div
          key={node.id}
          style={{
            position: 'absolute',
            left: node.x,
            top: node.y,
            background: 'lightgray',
            padding: '5px',
            cursor: 'pointer',
          }}
          onClick={() => handleNodeClick(node.id)}
        >
          {node.label}
        </div>
      ))}
      <svg className="edges">
        {edges.map((edge, index) => {
          const { x1, y1, x2, y2 } = calculateEdgeCoordinates(edge);
          return (
            <line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="red"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default Canvas;