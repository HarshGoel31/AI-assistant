import multer from "multer";
import { createCanvas, loadImage } from "canvas";

// Multer setup for file uploads
const upload = multer({ dest: "public/uploads/" });

export const config = {
  api: {
    bodyParser: false, // Required for multer
  },
};

// Middleware to handle file uploads
const uploadMiddleware = upload.fields([
  { name: "images", maxCount: 1 },
  { name: "garment", maxCount: 1 },
]);

export default function handler(req, res) {
  if (req.method === "POST") {
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.log(err, "err");
        return res.status(500).json({ error: "File upload failed" });
      }

      const userImage = req.files["images"][0];
      const garmentImage = req.files["garment"][0];

      try {
        const outputImage = await overlayImages(
          userImage.path,
          garmentImage.path
        );
        res.status(200).json({ preview: outputImage });
      } catch (error) {
        console.error("Error processing images:", error);
        res.status(500).json({ error: "Error applying virtual try-on" });
      }
    });
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}

// Overlay the garment onto the user image
// Overlay the garment onto the user image properly
async function overlayImages(userPath, garmentPath) {
  const userImg = await loadImage(userPath);
  const garmentImg = await loadImage(garmentPath);

  const canvas = createCanvas(userImg.width, userImg.height);
  const ctx = canvas.getContext("2d");

  // Draw user image first (background)
  ctx.drawImage(userImg, 0, 0, userImg.width, userImg.height);

  // Adjust garment dimensions for better fit
  const garmentWidth = userImg.width * 0.9; // Cover most of the width
  const aspectRatio = garmentImg.width / garmentImg.height;
  const garmentHeight = garmentWidth / aspectRatio; // Maintain aspect ratio

  // Positioning: Center horizontally, align to upper body
  const garmentX = (userImg.width - garmentWidth) / 2;
  const garmentY = userImg.height * 0.2; // Adjust to align with shoulders

  // Draw the garment image over the user image
  ctx.drawImage(garmentImg, garmentX, garmentY, garmentWidth, garmentHeight);

  // Convert canvas to image URL
  return canvas.toDataURL();
}

