export interface Artwork {
  id: number;
  title: string;
  artist: string;
  price: number;
  imageUrl: string;
  width: number;
  height: number;
  category: "manual" | "ai"; // ← নতুন
}

export const artworks: Artwork[] = [
  // --- Manual Row ---
  {
    id: 1,
    title: "Starry Dreams",
    artist: "Van Gogh Style",
    price: 2500,
    imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600",
    width: 60,
    height: 40,
    category: "manual",
  },
  {
    id: 2,
    title: "Abstract Bloom",
    artist: "Modern Art",
    price: 3200,
    imageUrl: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=600",
    width: 50,
    height: 50,
    category: "manual",
  },
  {
    id: 3,
    title: "Ocean Calm",
    artist: "Nature Series",
    price: 1800,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    width: 80,
    height: 50,
    category: "manual",
  },
  {
    id: 4,
    title: "Golden Hour",
    artist: "Landscape Art",
    price: 4000,
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
    width: 70,
    height: 45,
    category: "manual",
  },

  // --- AI Row ---
  {
    id: 5,
    title: "Midnight Forest",
    artist: "Dark Series",
    price: 3500,
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600",
    width: 60,
    height: 40,
    category: "ai",
  },
  {
    id: 6,
    title: "City Lights",
    artist: "Urban Art",
    price: 2800,
    imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600",
    width: 70,
    height: 50,
    category: "ai",
  },
  {
    id: 7,
    title: "Desert Dunes",
    artist: "Earth Series",
    price: 3100,
    imageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600",
    width: 80,
    height: 55,
    category: "ai",
  },
  {
    id: 8,
    title: "Cherry Blossom",
    artist: "Japan Series",
    price: 4500,
    imageUrl: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600",
    width: 65,
    height: 45,
    category: "ai",
  },
];