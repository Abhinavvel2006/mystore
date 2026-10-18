const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { accountError } = require("./accountProfile");

function firebaseConfig() {
  // Reuse the existing public Firebase web configuration in local development.
  // Deployed backends can configure FIREBASE_API_KEY and FIREBASE_PROJECT_ID.
  let frontend = {};
  try {
    frontend = dotenv.parse(
      fs.readFileSync(path.join(__dirname, "../../.env")),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return {
    apiKey:
      process.env.FIREBASE_API_KEY ||
      process.env.VITE_FIREBASE_API_KEY ||
      frontend.VITE_FIREBASE_API_KEY,
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      frontend.VITE_FIREBASE_PROJECT_ID,
  };
}

async function verifyFirebaseToken(
  idToken,
  provider,
  { config = firebaseConfig(), fetchImpl = fetch, now = Date.now() } = {},
) {
  if (typeof idToken !== "string" || !idToken || idToken.length > 16000) {
    throw accountError(401, "Please sign in again to verify your account.");
  }
  if (!config.apiKey || !config.projectId) {
    throw accountError(
      503,
      "Google and phone sign-in are not configured on the server.",
    );
  }
  let claims;
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) throw new Error("Malformed token");
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw accountError(401, "Please sign in again to verify your account.");
  }
  const seconds = Math.floor(now / 1000);
  // These checks constrain the project and sign-in method. Signature validity
  // is established by Firebase's accounts:lookup below, never by decoding alone.
  if (
    !claims ||
    typeof claims !== "object" ||
    Array.isArray(claims) ||
    claims.aud !== config.projectId ||
    claims.iss !== `https://securetoken.google.com/${config.projectId}` ||
    typeof claims.sub !== "string" ||
    !claims.sub ||
    claims.sub.length > 128 ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= seconds ||
    !Number.isFinite(claims.iat) ||
    claims.iat > seconds ||
    !Number.isFinite(claims.auth_time) ||
    claims.auth_time > seconds ||
    claims.firebase?.sign_in_provider !== provider
  ) {
    throw accountError(401, "Please sign in again to verify your account.");
  }
  let response;
  let data;
  try {
    response = await fetchImpl(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(config.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        signal: AbortSignal.timeout(10000),
      },
    );
    data = await response.json();
  } catch {
    throw accountError(
      503,
      "Unable to verify sign-in right now. Please try again.",
    );
  }
  if (response.status >= 500 || response.status === 429) {
    throw accountError(
      503,
      "Unable to verify sign-in right now. Please try again.",
    );
  }
  const identity = data?.users?.[0];
  if (
    !response.ok ||
    !identity ||
    identity.disabled ||
    identity.localId !== claims.sub ||
    !identity.providerUserInfo?.some((item) => item.providerId === provider) ||
    (provider === "google.com" &&
      (!identity.email || !identity.emailVerified)) ||
    (provider === "phone" && !identity.phoneNumber)
  ) {
    throw accountError(401, "Please sign in again to verify your account.");
  }
  return identity;
}

module.exports = { verifyFirebaseToken };
