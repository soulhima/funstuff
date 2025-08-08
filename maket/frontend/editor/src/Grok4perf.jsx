import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Transformer, Line } from 'react-konva';

function App() {
  // Define fixed canvas dimensions
  const canvasWidth = 800;
  const canvasHeight = 600;

  // State to store the list of rectangles
  const [rectangles, setRectangles] = useState([]);
  const gridSize = 20;
  // State to track the ID of the selected rectangle
  const [selectedId, setSelectedId] = useState(null);
  // References for Transformer and Layer components
  const trRef = useRef();
  const layerRef = useRef();

  // Function to add a new rectangle within canvas bounds
  const addRectangle = () => {
    const maxX = canvasWidth - 100; // Subtract rectangle width to keep it inside
    const maxY = canvasHeight - 50; // Subtract rectangle height to keep it inside
    const x = Math.round((Math.random() * maxX) / gridSize) * gridSize;
    const y = Math.round((Math.random() * maxY) / gridSize) * gridSize;
    const newRect = {
      x,
      y,
      width: 100,
      height: 50,
      fill: 'red',
      id: `rect${rectangles.length + 1}`,
    };
    setRectangles([...rectangles, newRect]);
  };

  // Function to snap position to grid
  const snapToGrid = (pos, gridSize = 20) => ({
    x: Math.round(pos.x / gridSize) * gridSize,
    y: Math.round(pos.y / gridSize) * gridSize,
  });

  // Grid component with fixed width and height
  const Grid = ({ gridSize = 20, width, height }) => {
    const lines = [];
    for (let i = 0; i < width / gridSize; i++) {
      lines.push(
        <Line
          key={`v${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#ddd"
          strokeWidth={1}
          listening={false} // Prevent grid lines from capturing events
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
          listening={false} // Prevent grid lines from capturing events
        />
      );
    }
    return <>{lines}</>;
  };

  // Function to handle rectangle selection
  const handleSelect = (e) => {
    e.cancelBubble = true; // Prevent click from bubbling to Stage
    const id = e.target.id();
    setSelectedId(id);
    const selectedNode = layerRef.current.findOne(`#${id}`);
    if (selectedNode) {
      trRef.current.nodes([selectedNode]);
      trRef.current.getLayer().batchDraw(); // Redraw layer
    }
  };

  return (
    <div>
      {/* Button to add a new rectangle */}
      <button onClick={addRectangle}>Add Rectangle</button>

      {/* Stage with fixed dimensions */}
      <Stage
        width={canvasWidth}
        height={canvasHeight}
        onClick={() => {
          // Deselect when clicking outside a rectangle
          setSelectedId(null);
          trRef.current.nodes([]);
          trRef.current.getLayer().batchDraw();
        }}
      >
        <Layer>
          {/* Grid with fixed size */}
          <Grid gridSize={20} width={canvasWidth} height={canvasHeight} />
        </Layer>
        <Layer ref={layerRef}>
          {/* Render all rectangles */}
          {rectangles.map((rect) => (
            <Rect
              key={rect.id}
              id={rect.id}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={rect.fill}
              dragBoundFunc={(pos) => snapToGrid(pos)}
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
                  r.id === node.id()
                    ? { ...r, x, y, width, height }
                    : r
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