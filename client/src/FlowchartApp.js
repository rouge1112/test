import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemTypes = {
  NODE: 'node',
};

const MenuItem = ({ label, onDragStart }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.NODE,
    item: { label },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [label]);

  const handleDragStart = () => {
    console.log('MenuItem: handleDragStart:', label);
    onDragStart(label);
  };

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move', margin: '5px' }} onDragStart={handleDragStart}>
      {label}
    </div>
  );
};

const Canvas = ({ nodes, edges, onDrop, handleNodeClick, currentEdge }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.NODE,
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      console.log('Canvas: Drop position:', offset);
      onDrop(item.label, offset);
    },
  }));

  return (
    <div ref={drop} className="canvas" style={{ position: 'relative', width: 500, height: 500, border: '1px solid black' }}>
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
          onClick={(e) => {
            e.stopPropagation();
            handleNodeClick(node.id);
          }}
        >
          {node.label}
        </div>
      ))}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {edges.map((edge, index) => {
          const sourceNode = nodes.find(node => node.id === edge.source);
          const targetNode = nodes.find(node => node.id === edge.target);
          if (sourceNode && targetNode) {
            return (
              <line
                key={index}
                x1={sourceNode.x + 25}
                y1={sourceNode.y + 10}
                x2={targetNode.x + 25}
                y2={targetNode.y + 10}
                style={{ stroke: 'black', strokeWidth: 2 }}
              />
            );
          }
          return null;
        })}
        {currentEdge && (
          <line
            x1={nodes.find(node => node.id === currentEdge.source)?.x + 25}
            y1={nodes.find(node => node.id === currentEdge.source)?.y + 10}
            x2={currentEdge.target !== null ? nodes.find(node => node.id === currentEdge.target)?.x + 25 : undefined}
            y2={currentEdge.target !== null ? nodes.find(node => node.id === currentEdge.target)?.y + 10 : undefined}
            style={{ stroke: 'red', strokeWidth: 2 }}
          />
        )}
      </svg>
    </div>
  );
};

const FlowchartApp = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [currentEdge, setCurrentEdge] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    fetchMenuItems();
    fetchData();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/menu_items.csv');
      const csvData = await response.text();
      const itemsArray = csvData.split('\n').filter(item => item.trim() !== '');
      setMenuItems(itemsArray);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const fetchData = async () => {
    try {
      const nodesResponse = await axios.get('http://localhost:3000/api/nodes');
      const edgesResponse = await axios.get('http://localhost:3000/api/edges');
      setNodes(nodesResponse.data);
      setEdges(edgesResponse.data);
      console.log('Fetched nodes:', nodesResponse.data);
      console.log('Fetched edges:', edgesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleNodeClick = async (nodeId) => {
    try {
      if (currentEdge) {
        const newEdge = { source: currentEdge.source, target: nodeId };
        console.log('Adding new edge:', newEdge);
        await axios.post('http://localhost:3000/api/edges', newEdge);
        setEdges([...edges, newEdge]);
        setCurrentEdge(null);
        fetchData();
      } else {
        setCurrentEdge({ source: nodeId, target: null });
        console.log('Setting current edge source:', nodeId);
      }
    } catch (error) {
      console.error('Error adding edge:', error);
    }
  };
  
  const handleDeleteAllNodes = async () => {
    try {
      await axios.delete('http://localhost:3000/api/nodes');
      fetchData();
    } catch (error) {
      console.error('Error deleting all nodes:', error);
    }
  };

  const handleDragStart = (label) => {
    console.log('FlowchartApp: handleDragStart:', label);
    setDraggedItem(label);
  };

  const handleDrop = async (label, offset) => {
    try {
      const canvasRect = document.querySelector('.canvas').getBoundingClientRect();
      const x = offset.x - canvasRect.left;
      const y = offset.y - canvasRect.top;
      const newNode = { label, x, y };
  
      const response = await axios.post('http://localhost:3000/api/nodes', newNode);
      const addedNode = response.data;
      setNodes([...nodes, addedNode]);
      console.log('New node added:', addedNode);
  
      // 新しいノードをドロップしたときにエッジを追加
      if (currentEdge && currentEdge.source) {
        const newEdge = { source: currentEdge.source, target: addedNode.id };
        await axios.post('http://localhost:3000/api/edges', newEdge);
        setEdges([...edges, newEdge]);
        console.log('New edge added:', newEdge);
        setCurrentEdge(null);
      } else {
        setCurrentEdge({ source: addedNode.id, target: null });
      }
  
      setDraggedItem(null);
      fetchData();
    } catch (error) {
      console.error('Error adding node:', error);
    }
  };
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        {menuItems.map((item) => (
          <MenuItem key={item} label={item} onDragStart={handleDragStart} />
        ))}
        <button onClick={handleDeleteAllNodes} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}>
          Delete All Nodes
        </button>
      </div>
      <Canvas nodes={nodes} edges={edges} onDrop={handleDrop} handleNodeClick={handleNodeClick} currentEdge={currentEdge} />
    </DndProvider>
  );
};

export default FlowchartApp;
