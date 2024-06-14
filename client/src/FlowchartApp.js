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
    item: { label }, // ドラッグするアイテムの情報を提供
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [label]);

  const handleDragStart = () => {
    onDragStart(label); // ドラッグ開始時にコールバックを呼び出す
  };

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }} onDragStart={handleDragStart}>
      {label}
    </div>
  );
};


const Canvas = ({ nodes, edges, onDrop, handleNodeClick, currentEdge }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.NODE,
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
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
            e.stopPropagation(); // Prevent canvas click handler
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
                x1={sourceNode.x + 25} // Adjust for node width
                y1={sourceNode.y + 10} // Adjust for node height
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
  const [draggedItem, setDraggedItem] = useState(null); // ドラッグ中のアイテム
  const [previousItem, setPreviousItem] = useState(null); // ドラッグ前のアイテム

  useEffect(() => {
    fetchMenuItems();
    fetchData();
  }, []);

  // メニュー表示用の処理
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
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleNodeClick = async (nodeId) => {
    try {
      if (currentEdge) {
        const newEdge = { source: currentEdge.source, target: nodeId };
        await axios.post('http://localhost:3000/api/edges', newEdge);
        setEdges([...edges, newEdge]); // 新しいエッジを追加
        setCurrentEdge(null);
        fetchData();
      } else {
        setCurrentEdge({ source: nodeId, target: null });
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
    console.log('handleDragStart:', label); // ドラッグ開始時にログ出力
    setDraggedItem(label); // ドラッグされたアイテムを記録
    const newEdge = { source: label, target: label }; // 例として target も label としていますが、実際のロジックに合わせて修正してください
    axios.post('http://localhost:3000/api/edges', newEdge)
      .then(() => {
        setEdges([...edges, newEdge]); // 新しいエッジを追加
      })
      .catch((error) => {
        console.error('Error creating edge:', error);
      });
  };
  

  const handleDrop = async (label, offset) => {
  try {
    console.log('ラベル名は:',label); 
    console.log('ドラッグ前のアイテム:', previousItem); // ドラッグ前のアイテムを出力
    console.log('ドラッグ中のアイテム:', draggedItem); // ドラッグ中のアイテムを出力

    // ドロップされたアイテムの情報を取得
    const canvasRect = document.querySelector('.canvas').getBoundingClientRect();
    const x = offset.x - canvasRect.left;
    const y = offset.y - canvasRect.top;
    const newNode = { label, x, y };
    
    // 新しいノードを追加
    const response = await axios.post('http://localhost:3000/api/nodes', newNode);
    setNodes([...nodes, response.data]);

      // エッジを作成 (draggedItemが存在する場合のみ)
      if (draggedItem !== null) {
        const newEdge = { source: draggedItem, target: label };
        await axios.post('http://localhost:3000/api/edges', newEdge);
        setEdges([...edges, newEdge]);
      }

    // ドラッグ関連の状態をリセット
    setPreviousItem(null);
    setDraggedItem(null);

    fetchData();
    } catch (error) {
      console.error('Error adding node:', error);
    }
  };

  useEffect(() => {
    // draggedItemの値が更新されたら実行される処理
    // エッジを作成 (draggedItemが存在する場合のみ)
    if (draggedItem !== null) {
      const newEdge = { source: draggedItem, target: draggedItem }; // 修正: targetをdraggedItemに変更
      axios.post('http://localhost:3000/api/edges', newEdge)
        .then(() => {
          setEdges([...edges, newEdge]);
        })
        .catch((error) => {
          console.error('Error creating edge:', error);
        });
    }
  }, [draggedItem, edges]);

  const drawConnection = (startNode, endNode) => {
    const startX = startNode.x + startNode.width / 2;
    const startY = startNode.y + startNode.height / 2;
    const endX = endNode.x + endNode.width / 2;
    const endY = endNode.y + endNode.height / 2;

    // 線の要素を作成
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);
    line.setAttribute('stroke', 'black');
    document.querySelector('svg').appendChild(line);
};

// ノードが接続されたときにdrawConnectionを呼び出す
//drawConnection(node1, node2);

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        {menuItems.map((item) => (
          <MenuItem key={item} label={item} onDragStart={() => handleDragStart(item)} />
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