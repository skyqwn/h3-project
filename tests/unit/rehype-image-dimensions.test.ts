import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { rehypeImageDimensions } from "../../lib/rehype-image-dimensions";

// Regression: MDX body images shipped with NO width/height, so lazy loads
// grew the document ~6000px mid-scroll and fought Lenis ("scrolls down
// then stalls"). The plugin must stamp real pixel dims from public/.

type Node = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
};

(async () => {
  // A known re-hosted image that exists on disk (square 966x966 .jpg).
  const slug = "gold-refining-pvc-pp-fumehood-scrubber-duct";
  const localSrc = `/blog/${slug}/6.jpg`;
  const onDisk = path.join(process.cwd(), "public", localSrc.slice(1));
  assert.ok(
    fs.existsSync(onDisk),
    `fixture image must exist on disk: ${onDisk}`
  );

  const tree: Node = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "p",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "img",
            properties: { src: localSrc, alt: "" },
            children: [],
          },
        ],
      },
      // External image: must be left untouched (can't read remote file).
      {
        type: "element",
        tagName: "img",
        properties: { src: "https://example.com/x.jpg" },
        children: [],
      },
      // Already-sized image: must not be overwritten.
      {
        type: "element",
        tagName: "img",
        properties: { src: localSrc, width: 100, height: 50 },
        children: [],
      },
    ],
  };

  rehypeImageDimensions()(tree);

  const localImg = tree.children![0]!.children![0]!.properties!;
  assert.equal(localImg.width, 966, "local img width stamped from file");
  assert.equal(localImg.height, 966, "local img height stamped from file");

  const extImg = tree.children![1]!.properties!;
  assert.equal(
    extImg.width,
    undefined,
    "external img is left untouched (no width)"
  );

  const presized = tree.children![2]!.properties!;
  assert.equal(presized.width, 100, "pre-sized width preserved");
  assert.equal(presized.height, 50, "pre-sized height preserved");

  console.log("rehype-image-dimensions.test: 5 assertions passed.");
})().catch((err) => {
  console.error("rehype-image-dimensions.test FAILED:", err);
  process.exit(1);
});
