import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { artworks, Artwork } from "@/data/artworks";
import dynamic from "next/dynamic";

// Konva SSR এ কাজ করে না, তাই dynamic import
const WallCanvas = dynamic(() => import("@/components/WallCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-900 rounded-xl">
      <p className="text-gray-400">Canvas loading...</p>
    </div>
  ),
});

export default function PreviewPage() {
  const router = useRouter();
  const { artworkId } = router.query;
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
        <div>
          <h1 className="font-bold text-lg">{artwork.title}</h1>
          <p className="text-gray-400 text-sm">{artwork.artist}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Wall Upload Section */}
        {!wallImage && (
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center hover:border-indigo-500 transition-colors">
            <p className="text-4xl mb-3">📷</p>
            <p className="text-gray-300 font-medium mb-1">
              Upload your wall photo
            </p>
            <p className="text-gray-500 text-sm mb-5">
              Take a photo of your wall and upload it here
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

        {/* Canvas Section */}
        {wallImage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-200">
                  Position the artwork on your wall
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Drag the corner points to fit the artwork on your wall
                </p>
              </div>
              <button
                onClick={() => setWallImage(null)}
                className="text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Change photo
              </button>
            </div>

            <WallCanvas wallImage={wallImage} artwork={artwork} />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="font-medium text-gray-300 mb-3">How to use</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-400">
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">1.</span>
              Upload a photo of your wall
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">2.</span>
              Drag the 4 corner dots to mark where the artwork should go
            </div>
            <div className="flex gap-2">
              <span className="text-indigo-400 font-bold">3.</span>
              See the artwork previewed on your wall!
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}