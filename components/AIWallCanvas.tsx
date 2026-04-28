import { useEffect, useState } from "react";
import { Artwork } from "@/data/artworks";

interface Props {
  wallImage: string;
  artwork: Artwork;
}

type Status = "idle" | "detecting" | "compositing" | "done" | "error";

export default function AIWallCanvas({ wallImage, artwork }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    runAIPipeline();
  }, [wallImage, artwork]);

  const runAIPipeline = async () => {
    try {
      setStatus("detecting");

      // Step 1: Hugging Face API তে wall image পাঠাও
      const detectRes = await fetch("/api/detect-wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: wallImage }),
      });

      if (!detectRes.ok) throw new Error("Detection failed");

      const { maskBase64 } = await detectRes.json();

      setStatus("compositing");

      // Step 2: Mask + Wall + Artwork দিয়ে final image বানাও
      const finalImage = await compositeImages(wallImage, artwork.imageUrl, maskBase64);

      setPreviewUrl(finalImage);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg("AI detection failed. Please try again.");
      setStatus("error");
    }
  };

  // Wall image এর center এ artwork বসাও (mask guided)
  const compositeImages = async (
    wallSrc: string,
    artworkSrc: string,
    maskSrc: string
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const W = 800;
      const H = 520;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      const wallImg = new Image();
      const artImg = new Image();
      const maskImg = new Image();

      artImg.crossOrigin = "anonymous";

      let loaded = 0;
      const tryComposite = () => {
        loaded++;
        if (loaded < 3) return;

        // 1. Draw wall background
        ctx.drawImage(wallImg, 0, 0, W, H);

        // 2. Mask থেকে wall region বের করো
        // Mask এ যেখানে foreground (subject) নেই সেখানেই wall
        // আমরা center এ একটা reasonable area তে artwork বসাবো
        const wallRegion = detectWallRegionFromMask(maskImg, W, H);

        // 3. Artwork টা wall region এ draw করো
        const padding = 40;
        const artX = wallRegion.x + padding;
        const artY = wallRegion.y + padding;
        const artW = Math.min(wallRegion.w - padding * 2, 300);
        const artH = (artW / artwork.width) * artwork.height;

        // Shadow effect
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 8;

        ctx.drawImage(artImg, artX, artY - artH / 2 + wallRegion.h / 2, artW, artH);

        // Frame effect
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 3;
        ctx.strokeRect(artX, artY - artH / 2 + wallRegion.h / 2, artW, artH);

        resolve(canvas.toDataURL("image/png"));
      };

      wallImg.onload = tryComposite;
      artImg.onload = tryComposite;
      maskImg.onload = tryComposite;

      wallImg.src = wallSrc;
      artImg.src = artworkSrc;
      maskImg.src = maskSrc;
    });
  };

  // Mask image analyse করে wall area বের করো
  const detectWallRegionFromMask = (
    maskImg: HTMLImageElement,
    W: number,
    H: number
  ) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = W;
    tempCanvas.height = H;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.drawImage(maskImg, 0, 0, W, H);

    // Default — upper half of image (wall সাধারণত উপরে থাকে)
    // Mask analysis করে আরো accurate করা যায়
    return { x: 0, y: 0, w: W, h: H * 0.7 };
  };

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      {status !== "done" && status !== "error" && (
        <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-white font-medium">
                {status === "detecting"
                  ? "🤖 AI is analyzing your wall..."
                  : "🎨 Placing artwork on your wall..."}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {status === "detecting"
                  ? "Detecting wall surface using AI"
                  : "Compositing the final preview"}
              </p>
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