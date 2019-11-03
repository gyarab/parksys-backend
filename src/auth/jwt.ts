import crypto from "crypto";

// From Mocasys Middleend
function toBase64Url(payload: any): string {
  return Buffer.from(JSON.stringify(payload))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// From Mocasys Middleend
export function fromBase64Url(payload: string): any {
  let s = payload;
  s = s.replace(/-/g, "+"); // 62nd char of encoding
  s = s.replace(/_/g, "/"); // 63rd char of encoding
  switch (
    s.length % 4 // Pad with trailing '='s
  ) {
    case 0:
      break; // No pad chars in this case
    case 2:
      s += "==";
      break; // Two pad chars
    case 3:
      s += "=";
      break; // One pad char
    default:
      throw new Error("Illegal base64url string!");
  }
  return Buffer.from(s, "base64"); // Standard base64 decoder
}

function hmac(secret: string, head: string, body: string): string {
  const hmac = crypto
    .createHmac("SHA256", secret)
    .update(head)
    .update(body);
  return toBase64Url(hmac.digest("base64"));
}

export function verifyToken(secret: string, token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token");
  }
  const recHead = parts[0];
  const recBody = parts[1];
  const recSignature = parts[2];
  const calcSignature = hmac(secret, recHead, recBody);
  return recSignature === calcSignature;
}

export function createToken(secret: string, body: any): string {
  const head = {
    alg: "HS256",
    typ: "JWT"
  };
  const head64 = toBase64Url(head);
  const body64 = toBase64Url(body);
  return head64 + "." + body64 + "." + hmac(secret, head64, body64);
}
