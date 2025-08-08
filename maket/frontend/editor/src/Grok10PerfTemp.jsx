import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Transformer, Line, Circle, Text } from 'react-konva';

function GraphVisualizer({ graphData }) {
  const { nodes, edges } = graphData;
  const graphWidth = 800;
  const graphHeight = 600;

  const nodeMap = nodes.reduce((map, node) => {
    map[node.id] = {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
    };
    return map;
  }, {});

  return (
    <Stage width={graphWidth} height={graphHeight}>
      <Layer>
        {edges.map((edge, index) => {
          const from = nodeMap[edge.from];
          const to = nodeMap[edge.to];
          return (
            <Line
              key={`edge-${index}`}
              points={[from.x, from.y, to.x, to.y]}
              stroke="black"
              strokeWidth={2}
            />
          );
        })}
        {nodes.map((node) => (
          <React.Fragment key={node.id}>
            <Circle
              x={nodeMap[node.id].x}
              y={nodeMap[node.id].y}
              radius={10}
              fill={node.type === 'hallway' ? 'blue' : 'red'}
            />
            <Text
              x={nodeMap[node.id].x - 15}
              y={nodeMap[node.id].y - 5}
              text={node.id}
              fontSize={12}
              fill="white"
            />
          </React.Fragment>
        ))}
      </Layer>
    </Stage>
  );
}

function App() {
  const canvasWidth = 800;
  const canvasHeight = 600;
  const gridSize = 20;

  const [rectangles, setRectangles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [layouts, setLayouts] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const trRef = useRef();
  const layerRef = useRef();
  const idCounter = useRef(0);

  const addRoom = () => {
    const maxX = canvasWidth - 100;
    const maxY = canvasHeight - 50;
    const x = Math.round((Math.random() * maxX) / gridSize) * gridSize;
    const y = Math.round((Math.random() * maxY) / gridSize) * gridSize;
    idCounter.current += 1;
    const newRect = {
      x,
      y,
      width: 100,
      height: 50,
      fill: 'red',
      id: `rect${idCounter.current}`,
      type: 'room',
    };
    setRectangles([...rectangles, newRect]);
    setSelectedId(null);
    trRef.current.nodes([]);
    trRef.current.getLayer().batchDraw();
  };

  const addHallway = () => {
    const maxX = canvasWidth - 50;
    const maxY = canvasHeight - 100;
    const x = Math.round((Math.random() * maxX) / gridSize) * gridSize;
    const y = Math.round((Math.random() * maxY) / gridSize) * gridSize;
    idCounter.current += 1;
    const newRect = {
      x,
      y,
      width: 50,
      height: 100,
      fill: 'blue',
      id: `rect${idCounter.current}`,
      type: 'hallway',
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
    setGraphData(null);
    trRef.current.nodes([]);
    trRef.current.getLayer().batchDraw();
  };

  const exportLayout = () => {
    const edges = [];
    for (let i = 0; i < rectangles.length; i++) {
      for (let j = i + 1; j < rectangles.length; j++) {
        const r1 = rectangles[i];
        const r2 = rectangles[j];
        const touchingX = r1.x + r1.width >= r2.x && r1.x <= r2.x + r2.width;
        const touchingY = r1.y + r1.height >= r2.y && r1.y <= r2.y + r2.height;
        if (touchingX && touchingY) {
          if (
            (r1.type === 'hallway' && r2.type === 'room') ||
            (r1.type === 'room' && r2.type === 'hallway')
          ) {
            edges.push({ from: r1.id, to: r2.id });
          }
        }
      }
    }
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
    console.log(JSON.stringify(graph, null, 2));
    return graph; // Return the graph instead of setting state immediately
  };

  const saveLayout = async () => {
    const updatedGraphData = exportLayout(); // Get the latest graph data
    setGraphData(updatedGraphData); // Update state before saving
    const name = prompt('Enter a name for this layout:');
    if (!name) return;

    try {
      const response = await fetch('http://localhost:5001/api/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data: updatedGraphData }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Layout saved with ID: ${result.id}`);
        await fetchTemplates(); // Refresh templates list after saving
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      alert('Error saving layout: ' + error.message);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/layouts');
      const data = await response.json();
      setLayouts(data);
      setShowTemplates(true);
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert('Error fetching templates: ' + error.message);
    }
  };

  const loadTemplate = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/layouts/${id}`);
      const layout = await response.json();
      if (layout.data) {
        console.log('Loaded layout:', layout.data);
        const nodesWithFill = layout.data.nodes.map((node) => ({
          ...node,
          fill: node.type === 'hallway' ? 'blue' : 'red',
        }));
        setRectangles(nodesWithFill);
        setGraphData({ ...layout.data, nodes: nodesWithFill });
        setShowTemplates(false);
        setSelectedId(null);
        trRef.current.nodes([]);
        layerRef.current.batchDraw();
      } else {
        throw new Error('Invalid layout data');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Error loading template: ' + error.message);
    }
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
      <button onClick={addRoom}>Add Room</button>
      <button onClick={addHallway}>Add Hallway</button>
      <button onClick={deleteRectangle} disabled={!selectedId}>
        Delete Selected
      </button>
      <button onClick={clearAll}>Clear All</button>
      <button onClick={exportLayout}>Export Layout</button>
      <button onClick={saveLayout}>Save</button>
      <button onClick={fetchTemplates}>Load Template</button>

      {showTemplates && layouts.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h4>Select a Template</h4>
          {layouts.map((layout) => (
            <button
              key={layout._id}
              onClick={() => loadTemplate(layout._id)}
              style={{ margin: '5px' }}
            >
              {layout.name} ({new Date(layout.createdAt).toLocaleDateString()})
            </button>
          ))}
        </div>
      )}

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

      {graphData && (
        <div style={{ marginTop: '20px' }}>
          <h3>Graph Visualization</h3>
          <GraphVisualizer graphData={graphData} />
        </div>
      )}
    </div>
  );
}

export default App;