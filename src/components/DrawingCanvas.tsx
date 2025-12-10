'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from './ui/slider';
import { Eraser, PaintBucket, Undo, Redo, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DrawingCanvasProps {
    onSave: (dataUrl: string) => void;
    initialData?: string;
}

export function DrawingCanvas({ onSave, initialData }: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(2);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [history, setHistory] = useState<string[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = 600;

        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load initial data if provided
        if (initialData) {
            const img = new window.Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = initialData;
        }

        saveToHistory();
    }, []);

    const saveToHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL();
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(dataUrl);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory();
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing && e.type !== 'mousedown') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const newStep = historyStep - 1;
            setHistoryStep(newStep);

            const img = new window.Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[newStep];
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const newStep = historyStep + 1;
            setHistoryStep(newStep);

            const img = new window.Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = history[newStep];
        }
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL();
        onSave(dataUrl);
    };

    const colors = [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
    ];

    return (
        <Card className="p-4 bg-white dark:bg-gray-900">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b dark:border-gray-700">
                <div className="flex gap-2">
                    <Button
                        variant={tool === 'pen' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTool('pen')}
                    >
                        <PaintBucket className="h-4 w-4 mr-2" />
                        Pen
                    </Button>
                    <Button
                        variant={tool === 'eraser' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTool('eraser')}
                    >
                        <Eraser className="h-4 w-4 mr-2" />
                        Eraser
                    </Button>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="text-sm dark:text-gray-300">Size:</span>
                    <Slider
                        value={[brushSize]}
                        onValueChange={(value) => setBrushSize(value[0])}
                        min={1}
                        max={20}
                        step={1}
                        className="flex-1"
                    />
                    <span className="text-sm dark:text-gray-300 w-8">{brushSize}px</span>
                </div>

                <div className="flex gap-1">
                    {colors.map((c) => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded border-2 ${color === c ? 'border-blue-500 scale-110' : 'border-gray-300 dark:border-gray-600'
                                } transition-transform`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyStep <= 0}>
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRedo} disabled={historyStep >= history.length - 1}>
                        <Redo className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClear}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <Button onClick={handleSave} className="ml-auto bg-gradient-to-r from-purple-600 to-pink-600">
                    Save Drawing
                </Button>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border border-gray-300 dark:border-gray-700 rounded cursor-crosshair w-full"
                style={{ touchAction: 'none' }}
            />
        </Card>
    );
}
