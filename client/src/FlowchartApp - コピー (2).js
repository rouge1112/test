import React, { useState, useEffect, useRef } from 'react';
import Canvas from './Canvas';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';

const ItemTypes = {
  NODE: 'node',
};

const MenuItem = ({ label, onDragStart }) => {
  const [, drag] = useDrag(() => ({
    type: ItemTypes.NODE,
    item: () => {
      onDragStart(label);
      return { label };
    },
  }), [label, onDragStart]);

  return (
    <div ref={drag} style={{ margin: '5px', cursor: 'move' }}>
      {label}
    </div>
  );
};

const FlowchartApp = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const previousNodeRef = useRef(null);

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
      const nodesResponse = await axios.get('/api/nodes');
      const edgesResponse = await axios.get('/api/edges');
      setNodes(nodesResponse.data);
      setEdges(edgesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleNodeClick = async (nodeId) => {
    try {
      if (previousNodeRef.current) {
        const newEdge = { source: previousNodeRef.current, target: nodeId };
        await axios.post('/api/edges', newEdge);
        setEdges(prevEdges => [...prevEdges, newEdge]);
      }
      previousNodeRef.current = nodeId;
    } catch (error) {
      console.error('Error adding edge:', error);
    }
  };

  const handleDrop = async (label, offset) => {
    try {
      const canvasRect = document.querySelector('.canvas').getBoundingClientRect();
      const x = offset.x - canvasRect.left;
      const y = offset.y - canvasRect.top;
      const newNode = { label, x, y };

      const response = await axios.post('/api/nodes', newNode);
      setNodes([...nodes, response.data]);

      if (previousNodeRef.current) {
        const newEdge = { source: previousNodeRef.current, target: response.data.id };
        await axios.post('/api/edges', newEdge);
        setEdges([...edges, newEdge]);
      }

      previousNodeRef.current = response.data.id;
    } catch (error) {
      console.error('Error adding node:', error);
    }
  };

  const handleDeleteAllNodes = async () => {
    try {
      await axios.delete('/api/nodes');
      fetchData();
    } catch (error) {
      console.error('Error deleting all nodes:', error);
    }
  };

  const handleDragStart = (label) => {
    console.log('handleDragStart:', label);
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
      <div className="flowchart-app">
        <Canvas
          nodes={nodes}
          edges={edges}
          onDrop={handleDrop}
          handleNodeClick={handleNodeClick}
        />
      </div>
    </DndProvider>
  );
};

export default FlowchartApp;