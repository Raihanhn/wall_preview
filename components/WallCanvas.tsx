import { useEffect, useRef, useState, useCallback } from "react";
import { Artwork } from "@/data/artworks";

interface Props {
  wallImage: string;
  artwork: Artwork;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CANVAS_W = 800;
const CANVAS_H = 520;
const HANDLE_SIZE = 12;
const EDGE_THICKNESS = 14; // how thick the edge hit zone is
const MIN_SIZE = 60;

type DragType =
  | "none"
  | "move"
  | "corner-tl"
  | "corner-tr"
  | "corner-br"
  | "corner-bl"
  | "edge-top"
  | "edge-right"
  | "edge-bottom"
  | "edge-left";

function getCursor(type: DragType): string {
  switch (type) {
    case "move": return "move";
    case "corner-tl": case "corner-br": return "nwse-resize";
    case "corner-tr": case "corner-bl": return "nesw-resize";
    case "edge-top": case "edge-bottom": return "ns-resize";
    case "edge-left": case "edge-right": return "ew-resize";
    default: return "default";
  }
}

function hitTest(rect: Rect, px: number, py: number): DragType {
  const { x, y, w, h } = rect;
  const hs = HANDLE_SIZE;
  const et = EDGE_THICKNESS;

  // Corners (priority)
  if (Math.abs(px - x) <= hs && Math.abs(py - y) <= hs) return "corner-tl";
  if (Math.abs(px - (x + w)) <= hs && Math.abs(py - y) <= hs) return "corner-tr";
  if (Math.abs(px - (x + w)) <= hs && Math.abs(py - (y + h)) <= hs) return "corner-br";
  if (Math.abs(px - x) <= hs && Math.abs(py - (y + h)) <= hs) return "corner-bl";

  // Edges (midpoints only, thick zone)
  const insideX = px > x + et && px < x + w - et;
  const insideY = py > y + et && py < y + h - et;

  if (Math.abs(py - y) <= et && insideX) return "edge-top";
  if (Math.abs(py - (y + h)) <= et && insideX) return "edge-bottom";
  if (Math.abs(px - x) <= et && insideY) return "edge-left";
  if (Math.abs(px - (x + w)) <= et && insideY) return "edge-right";

  // Inside = move
  if (px > x && px < x + w && py > y && py < y + h) return "move";

  return "none";
}

export default function WallCanvas({ wallImage, artwork }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const wallImgRef = useRef<HTMLImageElement | null>(null);
  const artImgRef = useRef<HTMLImageElement | null>(null);
  const imagesLoaded = useRef(0);

  const [rect, setRect] = useState<Rect>({ x: 200, y: 120, w: 360, h: 240 });
  const [dragType, setDragType] = useState<DragType>("none");
  const [hoverType, setHoverType] = useState<DragType>("none");
  const dragStart = useRef({ mx: 0, my: 0, rect: { x: 0, y: 0, w: 0, h: 0 } });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imagesReady, setImagesReady] = useState(false);

  // Load images
  useEffect(() => {
    imagesLoaded.current = 0;
    setImagesReady(false);

    const wallImg = new Image();
    const artImg = new Image();
    artImg.crossOrigin = "anonymous";

    const onLoad = () => {
      imagesLoaded.current++;
      if (imagesLoaded.current === 2) {
        wallImgRef.current = wallImg;
        artImgRef.current = artImg;
        setImagesReady(true);
      }
    };

    wallImg.onload = onLoad;
    artImg.onload = onLoad;
    wallImg.src = wallImage;
    artImg.src = artwork.imageUrl;
  }, [wallImage, artwork]);

  // Draw interactive canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !wallImgRef.current) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(wallImgRef.current, 0, 0, CANVAS_W, CANVAS_H);

    const { x, y, w, h } = rect;

    // Dim overlay outside selection
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.clearRect(x, y, w, h);

    // Artwork preview inside selection
    if (artImgRef.current) {
      ctx.drawImage(artImgRef.current, x, y, w, h);
    }

    // Border glow
    ctx.shadowColor = "rgba(99,102,241,0.7)";
    ctx.shadowBlur = 16;
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;

    // Dashed overlay border
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.setLineDash([]);

    // Edge midpoint indicators (show move arrows on hover)
    const edges: [number, number, DragType][] = [
      [x + w / 2, y, "edge-top"],
      [x + w / 2, y + h, "edge-bottom"],
      [x, y + h / 2, "edge-left"],
      [x + w, y + h / 2, "edge-right"],
    ];

    edges.forEach(([ex, ey, type]) => {
      const isHovered = hoverType === type;
      ctx.beginPath();
      ctx.arc(ex, ey, isHovered ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? "#a5b4fc" : "rgba(99,102,241,0.6)";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Corner handles
    const corners: [number, number, DragType][] = [
      [x, y, "corner-tl"],
      [x + w, y, "corner-tr"],
      [x + w, y + h, "corner-br"],
      [x, y + h, "corner-bl"],
    ];

    corners.forEach(([cx, cy, type]) => {
      const isHovered = hoverType === type;
      const hs = HANDLE_SIZE;
      ctx.fillStyle = isHovered ? "#fff" : "#6366f1";
      ctx.strokeStyle = isHovered ? "#6366f1" : "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - hs / 2, cy - hs / 2, hs, hs, 3);
      ctx.fill();
      ctx.stroke();
    });

    // Frame label
    ctx.fillStyle = "rgba(99,102,241,0.9)";
    ctx.fillRect(x, y - 26, 120, 22);
    ctx.fillStyle = "white";
    ctx.font = "11px system-ui";
    ctx.fillText(`${Math.round(w)} × ${Math.round(h)} px`, x + 6, y - 10);

  }, [rect, hoverType]);

  // Generate preview
  const generatePreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !wallImgRef.current || !artImgRef.current) return;

    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    ctx.drawImage(wallImgRef.current, 0, 0, CANVAS_W, CANVAS_H);

    const { x, y, w, h } = rect;

    // Frame shadow
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(artImgRef.current, x, y, w, h);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Outer gold frame
    ctx.strokeStyle = "rgba(200,175,120,0.95)";
    ctx.lineWidth = 8;
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);

    // Inner highlight
    ctx.strokeStyle = "rgba(255,245,200,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

    setPreviewUrl(canvas.toDataURL("image/png"));
  }, [rect]);

  useEffect(() => {
    if (imagesReady) {
      drawCanvas();
      generatePreview();
    }
  }, [imagesReady, drawCanvas, generatePreview]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / bounds.width;
    const scaleY = CANVAS_H / bounds.height;
    return {
      x: (e.clientX - bounds.left) * scaleX,
      y: (e.clientY - bounds.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: mx, y: my } = getCanvasPos(e);
    const type = hitTest(rect, mx, my);
    if (type === "none") return;
    setDragType(type);
    dragStart.current = { mx, my, rect: { ...rect } };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: mx, y: my } = getCanvasPos(e);

    if (dragType === "none") {
      setHoverType(hitTest(rect, mx, my));
      return;
    }

    const { mx: startX, my: startY, rect: startRect } = dragStart.current;
    const dx = mx - startX;
    const dy = my - startY;
    let { x, y, w, h } = startRect;

    switch (dragType) {
      case "move":
        x = Math.max(0, Math.min(CANVAS_W - w, x + dx));
        y = Math.max(0, Math.min(CANVAS_H - h, y + dy));
        break;
      case "corner-tl":
        x = Math.min(x + w - MIN_SIZE, x + dx);
        y = Math.min(y + h - MIN_SIZE, y + dy);
        w = startRect.w - (x - startRect.x);
        h = startRect.h - (y - startRect.y);
        break;
      case "corner-tr":
        y = Math.min(y + h - MIN_SIZE, y + dy);
        w = Math.max(MIN_SIZE, w + dx);
        h = startRect.h - (y - startRect.y);
        break;
      case "corner-br":
        w = Math.max(MIN_SIZE, w + dx);
        h = Math.max(MIN_SIZE, h + dy);
        break;
      case "corner-bl":
        x = Math.min(x + w - MIN_SIZE, x + dx);
        w = startRect.w - (x - startRect.x);
        h = Math.max(MIN_SIZE, h + dy);
        break;
      case "edge-top":
        y = Math.min(y + h - MIN_SIZE, y + dy);
        h = startRect.h - (y - startRect.y);
        break;
      case "edge-bottom":
        h = Math.max(MIN_SIZE, h + dy);
        break;
      case "edge-left":
        x = Math.min(x + w - MIN_SIZE, x + dx);
        w = startRect.w - (x - startRect.x);
        break;
      case "edge-right":
        w = Math.max(MIN_SIZE, w + dx);
        break;
    }

    // Clamp within canvas
    x = Math.max(0, x);
    y = Math.max(0, y);
    if (x + w > CANVAS_W) w = CANVAS_W - x;
    if (y + h > CANVAS_H) h = CANVAS_H - y;

    setRect({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (dragType !== "none") {
      setDragType("none");
      generatePreview();
    }
  };

  const activeCursor = dragType !== "none" ? getCursor(dragType) : getCursor(hoverType);

  return (
    <div className="space-y-5">
      {/* Instruction bar */}
      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2">
        <span className="text-indigo-400">💡</span>
        <span>
          <strong className="text-gray-200">Drag corners</strong> to resize ·{" "}
          <strong className="text-gray-200">Drag edges</strong> to move the frame ·{" "}
          <strong className="text-gray-200">Drag inside</strong> to reposition
        </span>
      </div>

      {/* Interactive canvas */}
      <div className="rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full block"
          style={{ cursor: activeCursor, touchAction: "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Hidden preview canvas */}
      <canvas ref={previewCanvasRef} className="hidden" />

      {/* Preview result */}
      {previewUrl && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Preview result
          </p>
          <div className="rounded-xl overflow-hidden border border-gray-700 shadow-xl">
            <img src={previewUrl} alt="Wall preview" className="w-full" />
          </div>
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = previewUrl;
              a.download = "wall-preview.png";
              a.click();
            }}
            className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm transition-colors font-medium flex items-center gap-2 w-fit"
          >
            ⬇️ Download Preview
          </button>
        </div>
      )}
    </div>
  );
}