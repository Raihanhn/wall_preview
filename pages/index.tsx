import { useRouter } from "next/router";
import { artworks } from "@/data/artworks";
import ArtworkCard from "@/components/ArtworkCard";

export default function Home() {
  const router = useRouter();

  const manualArtworks = artworks.filter((a) => a.category === "manual");
  const aiArtworks = artworks.filter((a) => a.category === "ai");

  const handlePreview = (artworkId: number, category: string) => {
    router.push(`/preview?artworkId=${artworkId}&mode=${category}`);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">🖼️ ArtWall</h1>
        <p className="text-gray-400 text-sm mt-1">
          Preview any artwork on your wall before buying
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-14">

        {/* Row 1 — Manual */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-200">
                🖱️ Manual Preview Collection
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Drag the corner points to position artwork on your wall
              </p>
            </div>
            <span className="ml-auto text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">
              Manual
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {manualArtworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onPreview={() => handlePreview(artwork.id, artwork.category)}
              />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Row 2 — AI */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-200">
                🤖 AI-Powered Preview Collection
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                AI automatically detects your wall — no manual dragging needed!
              </p>
            </div>
            <span className="ml-auto text-xs bg-indigo-900 text-indigo-300 px-3 py-1 rounded-full">
              AI Powered
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiArtworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onPreview={() => handlePreview(artwork.id, artwork.category)}
                isAi
              />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}