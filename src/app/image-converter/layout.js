import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Free Image Converter Online",
  description: "Convert PNG, JPG, WebP, and other image formats online in your browser. Adjust quality and dimensions while keeping your files private.",
  path: "/image-converter",
  keywords: ["image converter", "png to jpg", "jpg to webp", "convert image online"],
});

export default function ImageConverterLayout({ children }) { return children; }
