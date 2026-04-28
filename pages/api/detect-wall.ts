import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { imageBase64 } = req.body;
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // ✅ stabilityai/stable-diffusion-2-inpainting এর বদলে
    // Segformer — wall/floor/ceiling segment করতে পারে, free inference সাপোর্ট করে
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/nvidia/segformer-b5-finetuned-ade-640-640",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: imageBuffer,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("HF Error:", error);
      return res.status(500).json({ error: "AI detection failed", details: error });
    }

    // Segformer returns JSON with segmentation map
    const result = await response.json();

    // Wall label = 0 in ADE20K dataset (segformer uses this)
    // Result থেকে wall bounding box বের করো
    const wallRegion = extractWallRegion(result);

    return res.status(200).json({ wallRegion });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
}

function extractWallRegion(segResult: any) {
  // Segformer result থেকে wall area বের করি
  // ADE20K: label 0 = wall, label 3 = floor, label 5 = ceiling
  try {
    if (segResult && Array.isArray(segResult)) {
      const wallSegment = segResult.find(
        (s: any) => s.label === "wall" || s.label === "Wall"
      );
      if (wallSegment && wallSegment.mask) {
        return {
          detected: true,
          box: wallSegment.box || { xmin: 100, ymin: 50, xmax: 700, ymax: 450 },
        };
      }
    }
  } catch (e) {
    console.error("Parse error:", e);
  }

  // Fallback — যদি detect না হয় তাহলে default center region
  return {
    detected: false,
    box: { xmin: 100, ymin: 50, xmax: 700, ymax: 450 },
  };
}