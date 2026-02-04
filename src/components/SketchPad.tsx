import React, { useRef, useState, useEffect } from 'react';
import { X, Undo2, Trash2, Check, Pencil, Square, Circle, Minus, Move, ZoomIn, ZoomOut, RotateCcw, Home, PenTool } from 'lucide-react';

interface SketchPadProps {
  onSave: (imageData: string) => void;
  onClose: () => void;
}

type Tool = 'pen' | 'line' | 'rectangle' | 'circle' | 'eraser';

interface Point {
  x: number;
  y: number;
}

interface DrawnElement {
  tool: Tool;
  points: Point[];
  color: string;
  lineWidth: number;
}

const SketchPad: React.FC<SketchPadProps> = ({ onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#1e293b');
  const [lineWidth, setLineWidth] = useState(3);
  const [elements, setElements] = useState<DrawnElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawnElement | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  // Grid settings
  const gridSize = 20;
  const canvasWidth = 800;
  const canvasHeight = 600;

  useEffect(() => {
    redrawCanvas();
  }, [elements]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    drawGrid(ctx);

    // Redraw all elements
    elements.forEach(element => {
      drawElement(ctx, element);
    });
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawnElement) => {
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (element.tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 20;
    }

    switch (element.tool) {
      case 'pen':
      case 'eraser':
        if (element.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, element.points[0].y);
        for (let i = 1; i < element.points.length; i++) {
          ctx.lineTo(element.points[i].x, element.points[i].y);
        }
        ctx.stroke();
        break;

      case 'line':
        if (element.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, element.points[0].y);
        ctx.lineTo(element.points[1].x, element.points[1].y);
        ctx.stroke();
        break;

      case 'rectangle':
        if (element.points.length < 2) return;
        const rectWidth = element.points[1].x - element.points[0].x;
        const rectHeight = element.points[1].y - element.points[0].y;
        ctx.strokeRect(element.points[0].x, element.points[0].y, rectWidth, rectHeight);
        break;

      case 'circle':
        if (element.points.length < 2) return;
        const radius = Math.sqrt(
          Math.pow(element.points[1].x - element.points[0].x, 2) +
          Math.pow(element.points[1].y - element.points[0].y, 2)
        );
        ctx.beginPath();
        ctx.arc(element.points[0].x, element.points[0].y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
    }
  };

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const snapToGrid = (point: Point): Point => {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = tool === 'pen' || tool === 'eraser' 
      ? getCanvasPoint(e) 
      : snapToGrid(getCanvasPoint(e));
    
    setIsDrawing(true);
    setStartPoint(point);
    
    const newElement: DrawnElement = {
      tool,
      points: [point],
      color,
      lineWidth
    };
    setCurrentElement(newElement);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentElement) return;
    e.preventDefault();
    
    const point = tool === 'pen' || tool === 'eraser'
      ? getCanvasPoint(e)
      : snapToGrid(getCanvasPoint(e));
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen' || tool === 'eraser') {
      // Add point to current path
      const updatedElement = {
        ...currentElement,
        points: [...currentElement.points, point]
      };
      setCurrentElement(updatedElement);
      
      // Draw incrementally
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const lastPoint = currentElement.points[currentElement.points.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else {
      // For shapes, redraw preview
      redrawCanvas();
      const previewElement = {
        ...currentElement,
        points: [currentElement.points[0], point]
      };
      drawElement(ctx, previewElement);
    }
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentElement) return;
    e.preventDefault();
    
    let finalElement = currentElement;
    
    if (tool !== 'pen' && tool !== 'eraser' && startPoint) {
      const endPoint = snapToGrid(getCanvasPoint(e));
      finalElement = {
        ...currentElement,
        points: [startPoint, endPoint]
      };
    }
    
    setElements([...elements, finalElement]);
    setCurrentElement(null);
    setStartPoint(null);
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setElements(elements.slice(0, -1));
  };

  const handleClear = () => {
    setElements([]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a new canvas for the final image with professional styling
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvasWidth;
    finalCanvas.height = canvasHeight;
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw light blueprint grid
    ctx.strokeStyle = '#dbeafe';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Draw all elements with professional blueprint style
    elements.forEach(element => {
      ctx.strokeStyle = '#1e40af'; // Blueprint blue
      ctx.lineWidth = element.tool === 'eraser' ? 20 : Math.max(element.lineWidth, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (element.tool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
      }

      switch (element.tool) {
        case 'pen':
        case 'eraser':
          if (element.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          ctx.stroke();
          break;

        case 'line':
          if (element.points.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          ctx.lineTo(element.points[1].x, element.points[1].y);
          ctx.stroke();
          break;

        case 'rectangle':
          if (element.points.length < 2) return;
          const rectWidth = element.points[1].x - element.points[0].x;
          const rectHeight = element.points[1].y - element.points[0].y;
          ctx.strokeRect(element.points[0].x, element.points[0].y, rectWidth, rectHeight);
          
          // Add fill for rooms
          ctx.fillStyle = 'rgba(219, 234, 254, 0.3)';
          ctx.fillRect(element.points[0].x, element.points[0].y, rectWidth, rectHeight);
          break;

        case 'circle':
          if (element.points.length < 2) return;
          const radius = Math.sqrt(
            Math.pow(element.points[1].x - element.points[0].x, 2) +
            Math.pow(element.points[1].y - element.points[0].y, 2)
          );
          ctx.beginPath();
          ctx.arc(element.points[0].x, element.points[0].y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
      }
    });

    // Add title
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('GRUNDRISS-SKIZZE', 10, 20);

    // Add scale indicator
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvasWidth - 110, canvasHeight - 20);
    ctx.lineTo(canvasWidth - 10, canvasHeight - 20);
    ctx.stroke();
    ctx.fillStyle = '#1e40af';
    ctx.font = '10px Arial';
    ctx.fillText('≈ 5m', canvasWidth - 70, canvasHeight - 25);

    const imageData = finalCanvas.toDataURL('image/png');
    onSave(imageData);
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pen', icon: <Pencil size={20} />, label: 'Freihand' },
    { id: 'line', icon: <Minus size={20} />, label: 'Linie' },
    { id: 'rectangle', icon: <Square size={20} />, label: 'Rechteck' },
    { id: 'circle', icon: <Circle size={20} />, label: 'Kreis' },
    { id: 'eraser', icon: <PenTool size={20} />, label: 'Radierer' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Home size={24} className="text-indigo-400" />
            <div>
              <h2 className="font-bold text-lg">Grundriss zeichnen</h2>
              <p className="text-slate-400 text-xs">Zeichnen Sie einen einfachen Grundriss</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-100 p-3 flex flex-wrap items-center gap-2 border-b">
          {/* Tools */}
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            {tools.map(t => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`p-2 rounded-md transition-all ${
                  tool === t.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-300" />

          {/* Line width */}
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 shadow-sm">
            <span className="text-xs text-slate-500">Stärke:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 accent-indigo-600"
            />
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
            {['#1e293b', '#dc2626', '#16a34a', '#2563eb', '#9333ea'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-md transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-300" />

          {/* Actions */}
          <button
            onClick={handleUndo}
            disabled={elements.length === 0}
            className="p-2 bg-white rounded-lg shadow-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Rückgängig"
          >
            <Undo2 size={20} />
          </button>
          <button
            onClick={handleClear}
            disabled={elements.length === 0}
            className="p-2 bg-white rounded-lg shadow-sm text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Alles löschen"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4 bg-slate-200 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="bg-white rounded-lg shadow-lg cursor-crosshair touch-none"
            style={{ maxWidth: '100%', height: 'auto' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* Footer */}
        <div className="bg-white border-t p-4 flex justify-between items-center">
          <p className="text-sm text-slate-500">
            <span className="font-medium">Tipp:</span> Nutzen Sie Rechtecke für Räume, Linien für Wände
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={elements.length === 0}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={18} />
              Als Grundriss speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SketchPad;
