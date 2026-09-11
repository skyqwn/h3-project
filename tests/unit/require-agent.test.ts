import assert from "node:assert/strict";
import { requireAgentKey } from "@/lib/auth/require-agent";

function req(headers: Record<string, string> = {}): Request {
  return new Request("https://h3-tech.co.kr/api/admin/agent/posts", { method: "POST", headers });
}

process.env.BLOG_AGENT_WRITE_KEY = "test-agent-key-0123456789";

assert.equal(requireAgentKey(req({ "x-agent-key": "test-agent-key-0123456789" })), true);
assert.equal(requireAgentKey(req({ "x-agent-key": "wrong-key" })), false);
assert.equal(requireAgentKey(req({ "x-agent-key": "" })), false);
assert.equal(requireAgentKey(req()), false); // 헤더 자체가 없음
assert.equal(requireAgentKey(req({ "x-agent-key": "test-agent-key-012345678" })), false); // 한 글자 짧음(길이 다름)

// 키 미설정이면 fail closed
delete process.env.BLOG_AGENT_WRITE_KEY;
assert.equal(requireAgentKey(req({ "x-agent-key": "anything" })), false);

console.log("require-agent.test passed.");
