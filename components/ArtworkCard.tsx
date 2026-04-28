import Image from "next/image";
import { Artwork } from "@/data/artworks";

interface Props {
  artwork: Artwork;
  onPreview: () => void;
}

export default function ArtworkCard({ artwork, onPreview }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all group">
      <div className="relative h-52 overflow-hidden">
        <Image
          src={artwork.imageUrl}
          alt={artwork.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white">{artwork.title}</h3>
        <p className="text-gray-400 text-sm mt-1">{artwork.artist}</p>
        <p className="text-gray-500 text-xs mt-1">
          {artwork.width} × {artwork.height} cm
        </p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-green-400 font-bold">৳{artwork.price}</span>
          <button
            onClick={onPreview}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            Preview on wall →
          </button>
        </div>
      </div>
    </div>
  );
}