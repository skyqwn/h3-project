import assert from "node:assert/strict";
import { parseStart, formatStart, parseYoutubeInput } from "@/lib/youtube";

assert.equal(parseStart("6:27"), 387);
assert.equal(parseStart("387"), 387);
assert.equal(parseStart("387s"), 387);
assert.equal(parseStart("6m27s"), 387);
assert.equal(parseStart("1:02:03"), 3723);
assert.equal(parseStart(""), 0);
assert.equal(parseStart("abc"), null);
assert.equal(formatStart(387), "6:27");
assert.equal(formatStart(3723), "1:02:03");

assert.deepEqual(
  parseYoutubeInput(
    "https://www.youtube.com/watch?v=cY5_7EkxEcI&list=PL4QJAqi_5MQyDK0zRb3JgkdPLoY5Z0W8e"
  ),
  { id: "cY5_7EkxEcI", start: 0 }
);
assert.deepEqual(parseYoutubeInput("https://youtu.be/cY5_7EkxEcI?t=387"), {
  id: "cY5_7EkxEcI",
  start: 387,
});
assert.deepEqual(
  parseYoutubeInput("https://www.youtube.com/watch?v=cY5_7EkxEcI&t=6m27s"),
  { id: "cY5_7EkxEcI", start: 387 }
);
assert.equal(parseYoutubeInput("https://example.com/watch?v=cY5_7EkxEcI"), null);
assert.equal(parseYoutubeInput("not a url"), null);

console.log("youtube.test: passed.");
