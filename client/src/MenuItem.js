// src/MenuItem.js
import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './constants';

const MenuItem = ({ label, onDragStart }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.NODE,
    item: { label }, // ここでドラッグするアイテムの情報を提供
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    begin: () => {
      console.log('ドラッグ開始:', label); // ドラッグ開始時にログ出力
      onDragStart(label); // ドラッグ開始時にコールバックを呼び出す
    }
  }), [label]);

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {label}
    </div>
  );
};

export default MenuItem;
