// Entry point for `npm run test:unit`.
// Each *.test.ts file in this directory is imported; they self-execute and
// throw / process.exit(1) on failure.
import "./mdx.test";
import "./turnstile.test";
import "./notify.test";

console.log("All unit tests passed.");
