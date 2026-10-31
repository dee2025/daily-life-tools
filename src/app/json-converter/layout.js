import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "JSON Formatter, Validator & Converter Online",
  description: "Format, validate, explore, compare, and convert JSON online. Use split, text, tree, diff, and JSON-to-XML tools directly in your browser.",
  path: "/json-converter",
  keywords: ["json formatter", "json validator", "json viewer", "json to xml", "json diff"],
});

export default function JsonConverterLayout({ children }) { return children; }
