import React, { useState, useEffect, useRef } from 'react';
import Canvas from './Canvas'; // ここを修正
import { DndProvider, useDrag, useDrop } from 'react-dnd';
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

const Canvas = ({ nodes, edges, onDrop, handleNodeClick }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.NODE,
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      onDrop(item.label, offset);
    },
  }), [nodes, edges, onDrop]);

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
        onClick={() => handleNodeClick(node.id)}
      >
        {node.label}
      </div>
      ))}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {edges.map((edge, index) => {
          const sourceNodeId = edge.source;
          const targetNodeId = edge.target;
          const sourceNode = nodes.find(node => node.id === sourceNodeId);
          const targetNode = nodes.find(node => node.id === targetNodeId);

          if (sourceNode && targetNode) {
            const sourceX = sourceNode.x + 25;
            const sourceY = sourceNode.y + 25;
            const targetX = targetNode.x + 25;
            const targetY = targetNode.y + 25;
            console.log(`Edge ${index} (id: ${edge.id}): source (${sourceX}, ${sourceY}), target (${targetX}, ${targetY})`);
            return (
              <line
                key={index}
                x1={sourceX}
                y1={sourceY}
                x2={targetX}
                y2={targetY}
                style={{ stroke: 'black', strokeWidth: 2 }}
                onMouseEnter={() => console.log(`Line coordinates: (${sourceX}, ${sourceY}) -> (${targetX}, ${targetY})`)}
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

const FlowchartApp = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const previousItemRef = useRef(null);

  useEffect(() => {
    fetchMenuItems();
    fetchData();
  }, []);

  useEffect(() => {
    console.log('previousItem updated:', previousItemRef.current);
    console.log('nodes:', nodes);
    console.log('edges:', edges);
  }, [previousItemRef.current,nodes, edges]);

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
      console.log('handleNodeClick: before update');
      console.log('nodes:', nodes);
      console.log('edges:', edges);
  
      if (previousItemRef.current) {
        const newEdge = { source: previousItemRef.current, target: nodeId };
        const response = await axios.post('/api/edges', newEdge); // エッジをサーバーに追加
        setEdges(prevEdges => [...prevEdges, response.data]); // サーバーから返されたデータを使用してステートを更新
      }
      previousItemRef.current = nodeId;
  
      console.log('handleNodeClick: after update');
      console.log('nodes:', nodes);
      console.log('edges:', edges);
    } catch (error) {
      console.error('Error adding edge:', error);
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
    setDraggedItem(label); // 新しいドラッグ中のアイテムを設定
  };

  const handleDrop = async (label, offset) => {
    try {
      console.log('ラベル名は:', label);
      console.log('ドラッグ前のアイテム:', previousItemRef.current);
      console.log('ドラッグ中のアイテム:', draggedItem);
      console.log('handleDrop: before update');
      console.log('nodes:', nodes);
      console.log('edges:', edges);

      const canvasRect = document.querySelector('.canvas').getBoundingClientRect();
      const x = offset.x - canvasRect.left;
      const y = offset.y - canvasRect.top;
      const newNode = { label, x, y };

      const response = await axios.post('/api/nodes', newNode);
      setNodes([...nodes, response.data]);

      if (draggedItem !== null) {
        const newEdge = { source: draggedItem, target: response.data.id };
        await axios.post('/api/edges', newEdge);
        setEdges([...edges, newEdge]);
      }

      previousItemRef.current = response.data.id; // ドロップ後に現在のアイテムを前のアイテムとして設定
      console.log('handleDrop: after update');
      console.log('nodes:', nodes);
      console.log('edges:', edges);
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
      <div className="flowchart-app">
      <Canvas
        nodes={nodes}
        edges={edges}
        onDrop={handleDrop}
      />
    </div>
    </DndProvider>
  );
};

export default FlowchartApp;
