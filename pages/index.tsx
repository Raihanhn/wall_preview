import { useRouter } from "next/router";
import { artworks } from "@/data/artworks";
import ArtworkCard from "@/components/ArtworkCard";

export default function Home() {
  const router = useRouter();

  const handlePreview = (artworkId: number) => {
    router.push(`/preview?artworkId=${artworkId}`);
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

      {/* Gallery Grid */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-xl font-semibold mb-6 text-gray-200">
          Available Artworks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {artworks.map((artwork) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              onPreview={() => handlePreview(artwork.id)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}