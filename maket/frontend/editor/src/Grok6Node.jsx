import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Transformer, Line } from 'react-konva';

function App() {
  const canvasWidth = 800;
  const canvasHeight = 600;
  const gridSize = 20;

  const [rectangles, setRectangles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [rectType, setRectType] = useState('room'); // Default type: room
  const trRef = useRef();
  const layerRef = useRef();
  const idCounter = useRef(0);

  const addRectangle = () => {
    const maxX = canvasWidth - 100;
    const maxY = canvasHeight - 50;
    const x = Math.round((Math.random() * maxX) / gridSize) * gridSize;
    const y = Math.round((Math.random() * maxY) / gridSize) * gridSize;
    idCounter.current += 1;
    const newRect = {
      x,
      y,
      width: rectType === 'hallway' ? 50 : 100, // Hallways narrower
      height: rectType === 'hallway' ? 100 : 50, // Hallways taller
      fill: rectType === 'hallway' ? 'blue' : 'red', // Visual distinction
      id: `rect${idCounter.current}`,
      type: rectType, // Add type property
    };
    setRectangles([...rectangles, newRect]);
    setSelectedId(null);
    trRef.current.nodes([]);
    trRef.current.getLayer().batchDraw();
  };

  const deleteRectangle = () => {
    if (selectedId) {
      const updatedRects = rectangles.filter((rect) => rect.id !== selectedId);
      setRectangles(updatedRects);
      setSelectedId(null);
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  };

  const clearAll = () => {
    setRectangles([]);
    setSelectedId(null);
    trRef.current.nodes([]);
    trRef.current.getLayer().batchDraw();
  };

  const exportLayout = () => {
    const edges = [];

    // Check adjacency and apply edge rules
    for (let i = 0; i < rectangles.length; i++) {
      for (let j = i + 1; j < rectangles.length; j++) {
        const r1 = rectangles[i];
        const r2 = rectangles[j];

        // Check if rectangles touch or overlap
        const touchingX = r1.x + r1.width >= r2.x && r1.x <= r2.x + r2.width;
        const touchingY = r1.y + r1.height >= r2.y && r1.y <= r2.y + r2.height;

        if (touchingX && touchingY) {
          // Edge only if one is a hallway and the other is a room
          if (
            (r1.type === 'hallway' && r2.type === 'room') ||
            (r1.type === 'room' && r2.type === 'hallway')
          ) {
            edges.push({ from: r1.id, to: r2.id });
          }
        }
      }
    }

    // Graph data
    const graph = {
      nodes: rectangles.map((rect) => ({
        id: rect.id,
        type: rect.type,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      })),
      edges: edges,
    };

    // Print JSON to console
    console.log(JSON.stringify(graph, null, 2));
  };

  const snapToGrid = (pos) => ({
    x: Math.round(pos.x / gridSize) * gridSize,
    y: Math.round(pos.y / gridSize) * gridSize,
  });

  const Grid = ({ gridSize = 20, width, height }) => {
    const lines = [];
    for (let i = 0; i < width / gridSize; i++) {
      lines.push(
        <Line
          key={`v${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#ddd"
          strokeWidth={1}
          listening={false}
        />
      );
    }
    for (let j = 0; j < height / gridSize; j++) {
      lines.push(
        <Line
          key={`h${j}`}
          points={[0, j * gridSize, width, j * gridSize]}
          stroke="#ddd"
          strokeWidth={1}
          listening={false}
        />
      );
    }
    return <>{lines}</>;
  };

  const handleSelect = (e) => {
    const id = e.target.id();
    if (id === selectedId) {
      setSelectedId(null);
      trRef.current.nodes([]);
    } else {
      setSelectedId(id);
      const selectedNode = layerRef.current.findOne(`#${id}`);
      if (selectedNode) {
        trRef.current.nodes([selectedNode]);
      }
    }
    trRef.current.getLayer().batchDraw();
  };

  return (
    <div>
      <button onClick={addRectangle}>Add Rectangle</button>
      <button onClick={deleteRectangle} disabled={!selectedId}>
        Delete Selected
      </button>
      <button onClick={clearAll}>Clear All</button>
      <button onClick={exportLayout}>Export Layout</button>
      <select value={rectType} onChange={(e) => setRectType(e.target.value)}>
        <option value="room">Room</option>
        <option value="hallway">Hallway</option>
      </select>

      <Stage
        width={canvasWidth}
        height={canvasHeight}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedId(null);
            trRef.current.nodes([]);
            trRef.current.getLayer().batchDraw();
          }
        }}
      >
        <Layer>
          <Grid gridSize={20} width={canvasWidth} height={canvasHeight} />
        </Layer>
        <Layer ref={layerRef}>
          {rectangles.map((rect) => (
            <Rect
              key={rect.id}
              id={rect.id}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={rect.fill}
              dragBoundFunc={snapToGrid}
              draggable
              onClick={handleSelect}
              onTap={handleSelect}
              onDragEnd={(e) => {
                const updatedRects = rectangles.map((r) =>
                  r.id === rect.id ? { ...r, x: e.target.x(), y: e.target.y() } : r
                );
                setRectangles(updatedRects);
              }}
              onTransformEnd={(e) => {
                const node = e.target;
                let x = node.x();
                let y = node.y();
                let width = node.width() * node.scaleX();
                let height = node.height() * node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                x = Math.round(x / gridSize) * gridSize;
                y = Math.round(y / gridSize) * gridSize;
                width = Math.max(gridSize, Math.round(width / gridSize) * gridSize);
                height = Math.max(gridSize, Math.round(height / gridSize) * gridSize);
                node.position({ x, y });
                node.width(width);
                node.height(height);
                const updatedRects = rectangles.map((r) =>
                  r.id === node.id() ? { ...r, x, y, width, height } : r
                );
                setRectangles(updatedRects);
              }}
            />
          ))}
          <Transformer ref={trRef} anchorSize={15} />
        </Layer>
      </Stage>
    </div>
  );
}

export default App;