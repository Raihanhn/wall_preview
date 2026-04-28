import { useEffect, useState } from "react";
import { Artwork } from "@/data/artworks";

interface Props {
  wallImage: string;
  artwork: Artwork;
}

type Status = "detecting" | "compositing" | "done" | "error";

export default function AIWallCanvas({ wallImage, artwork }: Props) {
  const [status, setStatus] = useState<Status>("detecting");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    runAIPipeline();
  }, [wallImage, artwork]);

  const runAIPipeline = async () => {
    try {
      setStatus("detecting");
      setPreviewUrl(null);

      // API call with timeout — 15 সেকেন্ডের বেশি wait করবো না
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      let wallRegion = { detected: false, box: { xmin: 80, ymin: 60, xmax: 720, ymax: 440 } };

      try {
        const detectRes = await fetch("/api/detect-wall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: wallImage }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (detectRes.ok) {
          const data = await detectRes.json();
          if (data.wallRegion) wallRegion = data.wallRegion;
        }
      } catch (e) {
        // Timeout বা error হলে fallback region use করবো
        clearTimeout(timeout);
        console.warn("AI detection timed out, using fallback region");
      }

      setStatus("compositing");

      // Wall image এ artwork composite করো
      const finalImage = await compositeImages(wallImage, artwork.imageUrl, wallRegion.box);
      setPreviewUrl(finalImage);
      setStatus("done");

    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  const compositeImages = (
    wallSrc: string,
    artworkSrc: string,
    box: { xmin: number; ymin: number; xmax: number; ymax: number }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const W = 800;
      const H = 520;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      const wallImg = new Image();
      const artImg = new Image();
      artImg.crossOrigin = "anonymous";

      let loaded = 0;
      const onLoad = () => {
        loaded++;
        if (loaded < 2) return;

        // Wall background
        ctx.drawImage(wallImg, 0, 0, W, H);

        // Scale box to canvas size (API returns coords for original image)
        const scaleX = W / 800;
        const scaleY = H / 520;

        const regionX = box.xmin * scaleX;
        const regionY = box.ymin * scaleY;
        const regionW = (box.xmax - box.xmin) * scaleX;
        const regionH = (box.ymax - box.ymin) * scaleY;

        // Artwork size — region এর 60% জায়গা নেবে
        const artW = Math.min(regionW * 0.6, 280);
        const artH = (artW / artwork.width) * artwork.height;

        // Center of region এ place করো
        const artX = regionX + (regionW - artW) / 2;
        const artY = regionY + (regionH - artH) / 2;

        // Frame shadow
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 6;
        ctx.shadowOffsetY = 6;
        ctx.drawImage(artImg, artX, artY, artW, artH);

        // Picture frame border
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "rgba(200,180,140,0.9)";
        ctx.lineWidth = 6;
        ctx.strokeRect(artX, artY, artW, artH);

        // Inner frame line
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(artX + 8, artY + 8, artW - 16, artH - 16);

        resolve(canvas.toDataURL("image/png"));
      };

      wallImg.onerror = () => reject(new Error("Wall image load failed"));
      artImg.onerror = () => reject(new Error("Artwork image load failed"));

      wallImg.onload = onLoad;
      artImg.onload = onLoad;

      wallImg.src = wallSrc;
      artImg.src = artworkSrc;
    });
  };

  const statusMessages = {
    detecting: { icon: "🤖", title: "AI is analyzing your wall...", sub: "Detecting wall surface" },
    compositing: { icon: "🎨", title: "Placing artwork on your wall...", sub: "Creating your preview" },
    done: { icon: "", title: "", sub: "" },
    error: { icon: "❌", title: "Something went wrong", sub: errorMsg },
  };

  const msg = statusMessages[status];

  return (
    <div className="space-y-4">
      {/* Loading */}
      {(status === "detecting" || status === "compositing") && (
        <div className="bg-gray-900 rounded-xl p-10 text-center border border-gray-800">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-white font-medium">{msg.icon} {msg.title}</p>
              <p className="text-gray-500 text-sm mt-1">{msg.sub}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-400">{errorMsg}</p>
          <button
            onClick={runAIPipeline}
            className="mt-3 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Result */}
      {status === "done" && previewUrl && (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border border-gray-700">
            <img src={previewUrl} alt="AI Wall Preview" className="w-full" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={runAIPipeline}
              className="border border-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              🔄 Regenerate
            </button>
            <button
              onClick={() => {
                const a = document.createElement("a");
                a.href = previewUrl;
                a.download = "ai-wall-preview.png";
                a.click();
              }}
              className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm transition-colors"
            >
              ⬇️ Download Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}