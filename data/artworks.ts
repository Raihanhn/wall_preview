//data/artworks.ts

export interface Artwork {
  id: number;
  title: string;
  artist: string;
  price: number;
  imageUrl: string;
  width: number;  // real size in cm
  height: number;
}

export const artworks: Artwork[] = [
  {
    id: 1,
    title: "Starry Dreams",
    artist: "Van Gogh Style",
    price: 2500,
    imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600",
    width: 60,
    height: 40,
  },
  {
    id: 2,
    title: "Abstract Bloom",
    artist: "Modern Art",
    price: 3200,
    imageUrl: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=600",
    width: 50,
    height: 50,
  },
  {
    id: 3,
    title: "Ocean Calm",
    artist: "Nature Series",
    price: 1800,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    width: 80,
    height: 50,
  },
  {
    id: 4,
    title: "Golden Hour",
    artist: "Landscape Art",
    price: 4000,
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
    width: 70,
    height: 45,
  },
];