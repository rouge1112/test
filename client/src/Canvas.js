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
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {edges.map((edge, index) => (
          <Line
            key={index}
            sourceNode={edge.source}
            targetNode={edge.target}
          />
        ))}
      </svg>
    </div>
  );
};

export default Canvas;