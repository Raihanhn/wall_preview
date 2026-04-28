import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Circle, Line } from "react-konva";
import { Artwork } from "@/data/artworks";
import useImage from "use-image";

// এই package টাও install করতে হবে
// npm install use-image

interface Props {
  wallImage: string;
  artwork: Artwork;
}

interface Point {
  x: number;
  y: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 520;

export default function WallCanvas({ wallImage, artwork }: Props) {
  const [wallImg] = useImage(wallImage);
  const [artworkImg] = useImage(artwork.imageUrl, "anonymous");

  // Default 4 corner points — center এ একটা rectangle
  const [corners, setCorners] = useState<Point[]>([
    { x: 220, y: 130 }, // top-left
    { x: 580, y: 130 }, // top-right
    { x: 580, y: 390 }, // bottom-right
    { x: 220, y: 390 }, // bottom-left
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Corner drag handler
  const handleDragMove = (index: number, x: number, y: number) => {
    setCorners((prev) => {
      const updated = [...prev];
      updated[index] = { x, y };
      return updated;
    });
  };

  // Perspective transform — artwork কে 4 corners এ fit করে
  useEffect(() => {
    if (!wallImg || !artworkImg) return;

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Wall background draw
    ctx.drawImage(wallImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Perspective transform apply করো
    applyPerspectiveTransform(ctx, artworkImg, corners);

    setPreviewUrl(canvas.toDataURL());
  }, [wallImg, artworkImg, corners]);

  return (
    <div className="space-y-4">
      {/* Interactive Canvas — corner points drag করার জন্য */}
      <div className="rounded-xl overflow-hidden border border-gray-700">
        <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          <Layer>
            {/* Wall image */}
            {wallImg && (
              <KonvaImage
                image={wallImg}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
              />
            )}

            {/* Corner-to-corner lines দেখানোর জন্য */}
            <Line
              points={[
                corners[0].x, corners[0].y,
                corners[1].x, corners[1].y,
                corners[2].x, corners[2].y,
                corners[3].x, corners[3].y,
              ]}
              closed
              stroke="#6366f1"
              strokeWidth={2}
              dash={[6, 4]}
            />

            {/* 4টা draggable corner dots */}
            {corners.map((point, i) => (
              <Circle
                key={i}
                x={point.x}
                y={point.y}
                radius={10}
                fill="#6366f1"
                stroke="white"
                strokeWidth={2}
                draggable
                onDragMove={(e) =>
                  handleDragMove(i, e.target.x(), e.target.y())
                }
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Preview Result */}
      {previewUrl && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">Preview result:</p>
          <div className="rounded-xl overflow-hidden border border-gray-700">
            <img
              src={previewUrl}
              alt="Wall preview"
              className="w-full"
            />
          </div>
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = previewUrl;
              a.download = "wall-preview.png";
              a.click();
            }}
            className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm transition-colors"
          >
            Download Preview
          </button>
        </div>
      )}
    </div>
  );
}

// Perspective Transform Function
function applyPerspectiveTransform(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dst: Point[]
) {
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;

  // Source points (artwork এর 4 কোণ)
  const src: Point[] = [
    { x: 0, y: 0 },
    { x: sw, y: 0 },
    { x: sw, y: sh },
    { x: 0, y: sh },
  ];

  // Small triangle strips দিয়ে perspective simulate করি
  // (Browser এ native perspective transform নেই, তাই এই approach)
  const STEPS = 30;

  ctx.save();

  for (let y = 0; y < STEPS; y++) {
    for (let x = 0; x < STEPS; x++) {
      const x0 = x / STEPS;
      const x1 = (x + 1) / STEPS;
      const y0 = y / STEPS;
      const y1 = (y + 1) / STEPS;

      // Bilinear interpolation দিয়ে destination points বের করি
      const d00 = bilinear(dst, x0, y0);
      const d10 = bilinear(dst, x1, y0);
      const d11 = bilinear(dst, x1, y1);
      const d01 = bilinear(dst, x0, y1);

      // Source rectangle
      const sx = x0 * sw;
      const sy = y0 * sh;
      const sw2 = (x1 - x0) * sw;
      const sh2 = (y1 - y0) * sh;

      // Canvas transform দিয়ে quadrilateral এ আঁকি
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(d00.x, d00.y);
      ctx.lineTo(d10.x, d10.y);
      ctx.lineTo(d11.x, d11.y);
      ctx.lineTo(d01.x, d01.y);
      ctx.closePath();
      ctx.clip();

      // Transform matrix বের করি
      const matrix = getTransformMatrix(
        d00, d10, d01,
        { x: sx, y: sy },
        { x: sx + sw2, y: sy },
        { x: sx, y: sy + sh2 }
      );

      if (matrix) {
        ctx.transform(
          matrix[0], matrix[1],
          matrix[2], matrix[3],
          matrix[4], matrix[5]
        );
      }

      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }
  }

  ctx.restore();
}

// Bilinear interpolation
function bilinear(corners: Point[], tx: number, ty: number): Point {
  const [tl, tr, br, bl] = corners;
  return {
    x:
      tl.x * (1 - tx) * (1 - ty) +
      tr.x * tx * (1 - ty) +
      br.x * tx * ty +
      bl.x * (1 - tx) * ty,
    y:
      tl.y * (1 - tx) * (1 - ty) +
      tr.y * tx * (1 - ty) +
      br.y * tx * ty +
      bl.y * (1 - tx) * ty,
  };
}

// Affine transform matrix
function getTransformMatrix(
  d00: Point, d10: Point, d01: Point,
  s00: Point, s10: Point, s01: Point
): number[] | null {
  const dx1 = d10.x - d00.x;
  const dy1 = d10.y - d00.y;
  const dx2 = d01.x - d00.x;
  const dy2 = d01.y - d00.y;

  const sx1 = s10.x - s00.x;
  const sy1 = s10.y - s00.y;
  const sx2 = s01.x - s00.x;
  const sy2 = s01.y - s00.y;

  const det = sx1 * sy2 - sx2 * sy1;
  if (Math.abs(det) < 0.0001) return null;

  const a = (dx1 * sy2 - dx2 * sy1) / det;
  const b = (dx2 * sx1 - dx1 * sx2) / det;
  const c = (dy1 * sy2 - dy2 * sy1) / det;
  const d = (dy2 * sx1 - dy1 * sx2) / det;
  const e = d00.x - a * s00.x - b * s00.y;
  const f = d00.y - c * s00.x - d * s00.y;

  return [a, c, b, d, e, f];
}