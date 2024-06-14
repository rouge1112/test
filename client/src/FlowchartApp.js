import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './FlowchartApp.css';

const FlowchartApp = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [previousItem, setPreviousItem] = useState(null);
    const previousItemRef = useRef(null);
    const svgRef = useRef(null);

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        try {
            const response = await axios.get('/api/menuItems');
            setMenuItems(response.data);
        } catch (error) {
            console.error('Error fetching menu items:', error);
        }
    };

    const handleDragStart = (label) => {
        console.log(`handleDragStart: ${label}`);
        console.log(`Setting previousItem to: ${previousItem}`);
        setPreviousItem(draggedItem);
        previousItemRef.current = draggedItem;
        setDraggedItem(label);
    };

    const drawConnection = (startNode, endNode) => {
        if (!svgRef.current || !startNode || !endNode) return;
        const startX = startNode.x + startNode.width / 2;
        const startY = startNode.y + startNode.height / 2;
        const endX = endNode.x + endNode.width / 2;
        const endY = endNode.y + endNode.height / 2;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.setAttribute('stroke', 'black');
        svgRef.current.appendChild(line);
    };

    useEffect(() => {
        if (previousItem && draggedItem) {
            // Here, you should determine the position and size of your nodes
            const node1 = { x: 100, y: 100, width: 50, height: 50 }; // Example node1 position and size
            const node2 = { x: 300, y: 300, width: 50, height: 50 }; // Example node2 position and size
            drawConnection(node1, node2);
        }
        previousItemRef.current = draggedItem;
    }, [draggedItem, previousItem]);

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flowchart-app">
                <svg ref={svgRef} className="flowchart-canvas"></svg>
                <div className="menu">
                    {menuItems.map((item) => (
                        <MenuItem key={item.id} label={item.label} onDragStart={handleDragStart} />
                    ))}
                </div>
            </div>
        </DndProvider>
    );
};

const MenuItem = ({ label, onDragStart }) => {
    const [, drag] = useDrag(() => ({
        type: 'MENU_ITEM',
        item: { label },
        begin: () => {
            onDragStart(label);
        },
    }));

    return (
        <div ref={drag} className="menu-item">
            {label}
        </div>
    );
};

export default FlowchartApp;
