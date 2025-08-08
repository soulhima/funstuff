import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';

function App() {
  // State to store the list of rectangles
  const [rectangles, setRectangles] = useState([]);
  // State to track the ID of the selected rectangle
  const [selectedId, setSelectedId] = useState(null);
  // Reference for the Transformer component
  const trRef = useRef();
  // Reference for the Layer component
  const layerRef = useRef();

  // Function to add a new rectangle
  const addRectangle = () => {
    const newRect = {
      x: Math.random() * (window.innerWidth - 100), // Adjusted to keep rectangle in view
      y: Math.random() * (window.innerHeight - 50), // Adjusted to keep rectangle in view
      width: 100,
      height: 50,
      fill: 'red',
      id: `rect${rectangles.length + 1}`, // Unique ID (for now)
    };
    setRectangles([...rectangles, newRect]);
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
                // Update dimensions and position after resizing
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                // Reset scale to 1 to avoid cumulative scaling
                node.scaleX(1);
                node.scaleY(1);
                const updatedRects = rectangles.map((r) =>
                  r.id === node.id()
                    ? {
                        ...r,
                        x: node.x(),
                        y: node.y(),
                        width: node.width() * scaleX,
                        height: node.height() * scaleY,
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
            boundBoxFunc={(oldBox, newBox) => {
              // Prevent resizing below a minimum size
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}

export default App;