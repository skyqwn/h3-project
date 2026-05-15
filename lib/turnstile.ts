const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare Turnstile token verification. Returns true only when the API
 * confirms success — network failure, non-200 status, or success:false all
 * collapse to false so the caller can reject the submission uniformly.
 */
export async function verifyTurnstile(
  token: string,
  secret: string
): Promise<boolean> {
  try {
    const body = new URLSearchParams({ secret, response: token });
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
