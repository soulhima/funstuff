import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Transformer, Line } from 'react-konva';

function App() {
  // State to store the list of rectangles
  const [rectangles, setRectangles] = useState([]);

  const gridSize = 20;
  // State to track the ID of the selected rectangle
  const [selectedId, setSelectedId] = useState(null);
  // Reference for the Transformer component
  const trRef = useRef();
  // Reference for the Layer component
  const layerRef = useRef();

  // Function to add a new rectangle
  const addRectangle = () => {
    const gridSize = 20;
    const x = Math.round((Math.random() * window.innerWidth) / gridSize) * gridSize;
    const y = Math.round((Math.random() * window.innerHeight) / gridSize) * gridSize;
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

  const snapToGrid = (pos, gridSize = 20) => ({
    x: Math.round(pos.x / gridSize) * gridSize,
    y: Math.round(pos.y / gridSize) * gridSize,
  });

  const Grid = ({ gridSize = 20 }) => {
    const lines = [];
    const width = window.innerWidth;
    const height = window.innerHeight;
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
    e.cancelBubble = true; // Prevent the click from bubbling to the Stage
    const id = e.target.id();
    setSelectedId(id);
    // Find the selected node in the layer and attach it to the Transformer
    const selectedNode = layerRef.current.findOne(`#${id}`);
    if (selectedNode) {
      trRef.current.nodes([selectedNode]);
      trRef.current.getLayer().batchDraw(); // Redraw the layer for updates
    }
  };

  return (
    <div>
      {/* Button to add a new rectangle */}
      <button onClick={addRectangle}>Add Rectangle</button>

      {/* Stage is the canvas container */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onClick={() => {
          // Deselect when clicking outside a rectangle
          setSelectedId(null);
          trRef.current.nodes([]);
          trRef.current.getLayer().batchDraw();
        }}
      >
        <Layer>
          <Grid gridSize={20} />
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
              onClick={handleSelect} // Handle selection on click
              onTap={handleSelect} // Handle selection on tap (for mobile)
              onDragEnd={(e) => {
                // Update position after dragging
                const updatedRects = rectangles.map((r) =>
                  r.id === rect.id ? { ...r, x: e.target.x(), y: e.target.y() } : r
                );
                setRectangles(updatedRects);
              }}
              onTransformEnd={(e) => {
                const node = e.target;
                // Get the current position and size after transform
                let x = node.x();
                let y = node.y();
                let width = node.width() * node.scaleX();
                let height = node.height() * node.scaleY();
                // Reset scale to 1
                node.scaleX(1);
                node.scaleY(1);
                // Snap to grid
                x = Math.round(x / gridSize) * gridSize;
                y = Math.round(y / gridSize) * gridSize;
                width = Math.max(gridSize, Math.round(width / gridSize) * gridSize); // Ensure minimum size
                height = Math.max(gridSize, Math.round(height / gridSize) * gridSize); // Ensure minimum size
                // Update node properties
                node.position({ x, y });
                node.width(width);
                node.height(height);
                // Update state
                const updatedRects = rectangles.map((r) =>
                  r.id === node.id()
                    ? {
                        ...r,
                        x,
                        y,
                        width,
                        height,
                      }
                    : r
                );
                setRectangles(updatedRects);
              }}
            />
          ))}

          {/* Transformer for resizing the selected rectangle */}
          <Transformer
            ref={trRef}
            anchorSize={15}
          />
        </Layer>
      </Stage>
    </div>
  );
}

export default App;