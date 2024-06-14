import React from 'react';
import Canvas from './Canvas';

const Diagram = ({ nodes, edges, onDrop }) => {
  return (
    <div className="diagram">
      <Canvas
        nodes={nodes}
        edges={edges}
        onDrop={onDrop}
      />
    </div>
  );
};

export default Diagram;