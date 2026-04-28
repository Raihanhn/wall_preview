import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { artworks, Artwork } from "@/data/artworks";
import dynamic from "next/dynamic";

const WallCanvas = dynamic(() => import("@/components/WallCanvas"), {
  ssr: false,
  loading: () => <CanvasLoader />,
});

const AIWallCanvas = dynamic(() => import("@/components/AIWallCanvas"), {
  ssr: false,
  loading: () => <CanvasLoader />,
});

function CanvasLoader() {
  return (
    <div className="flex items-center justify-center h-96 bg-gray-900 rounded-xl">
      <p className="text-gray-400">Canvas loading...</p>
    </div>
  );
}

export default function PreviewPage() {
  const router = useRouter();
  const { artworkId, mode } = router.query;
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [wallImage, setWallImage] = useState<string | null>(null);

  useEffect(() => {
    if (artworkId) {
      const found = artworks.find((a) => a.id === Number(artworkId));
      setArtwork(found || null);
    }
  }, [artworkId]);

  const handleWallUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setWallImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  if (!artwork) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Artwork not found</p>
      </div>
    );
  }

  const isAiMode = mode === "ai";

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-bold text-lg">{artwork.title}</h1>
            <p className="text-gray-400 text-sm">{artwork.artist}</p>
          </div>
          {isAiMode && (
            <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
              🤖 AI Mode
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Wall Upload */}
        {!wallImage && (
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center hover:border-indigo-500 transition-colors">
            <p className="text-4xl mb-3">{isAiMode ? "🤖" : "📷"}</p>
            <p className="text-gray-300 font-medium mb-1">
              Upload your wall photo
            </p>
            <p className="text-gray-500 text-sm mb-5">
              {isAiMode
                ? "AI will automatically detect your wall and place the artwork"
                : "You can manually position the artwork by dragging corner points"}
            </p>
            <label className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg cursor-pointer transition-colors">
              Choose Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleWallUpload}
              />
            </label>
          </div>
        )}

        {/* Canvas — mode অনুযায়ী আলাদা component */}
        {wallImage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-200">
                  {isAiMode
                    ? "🤖 AI is placing the artwork on your wall..."
                    : "Position the artwork on your wall"}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {isAiMode
                    ? "AI automatically detects the best position"
                    : "Drag the corner points to fit the artwork"}
                </p>
              </div>
              <button
                onClick={() => setWallImage(null)}
                className="text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Change photo
              </button>
            </div>

            {/* Mode অনুযায়ী component */}
            {isAiMode ? (
              <AIWallCanvas wallImage={wallImage} artwork={artwork} />
            ) : (
              <WallCanvas wallImage={wallImage} artwork={artwork} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}