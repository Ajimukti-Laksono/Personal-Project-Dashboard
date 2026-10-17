import crypto from "crypto";

/**
 * Verifies the X-Hub-Signature-256 header sent by GitHub webhooks
 * using constant-time comparison to prevent timing attacks.
 *
 * @param rawBody - The unparsed raw body string from the HTTP request
 * @param signatureHeader - Value of X-Hub-Signature-256 (format: 'sha256=...')
 * @param secret - The webhook secret configured in GitHub and environment
 * @returns boolean indicating whether the signature is valid
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  // GitHub sends format: sha256=<hex_digest>
  if (!signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const receivedDigest = signatureHeader.slice(7);

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody, "utf-8");
  const calculatedDigest = hmac.digest("hex");

  const receivedBuffer = Buffer.from(receivedDigest, "utf-8");
  const calculatedBuffer = Buffer.from(calculatedDigest, "utf-8");

  // Constant-time check requires buffers of identical length
  if (receivedBuffer.length !== calculatedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, calculatedBuffer);
}

/**
 * Generates a valid GitHub X-Hub-Signature-256 header value for a given payload and secret.
 * Used for testing and simulation.
 */
export function signWebhookPayload(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload, "utf-8");
  return `sha256=${hmac.digest("hex")}`;
}
