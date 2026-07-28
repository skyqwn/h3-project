// Entry point for `npm run test:unit`.
// Each *.test.ts file in this directory is imported; they self-execute and
// throw / process.exit(1) on failure.
import "./mdx.test";
import "./turnstile.test";
import "./notify.test";
import "./blog-pagination.test";
import "./naver-convert.test";
import "./rehype-image-dimensions.test";
import "./contact-schema.test";
import "./slug.test";
import "./image-src.test";

console.log("All unit tests passed.");
