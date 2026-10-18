const express = require("express");
const { randomBytes, createHash } = require("node:crypto");
const User = require("../model/user");
const AccountSession = require("../model/accountSession");
const {
  accountError,
  readProfileInput,
  serializeUser,
} = require("../services/accountProfile");
const { verifyFirebaseToken } = require("../services/firebaseIdentity");

const tokenHash = (token) => createHash("sha256").update(token).digest("hex");
const sessionDuration = 30 * 24 * 60 * 60 * 1000;

function createAccountRoutes({
  UserModel = User,
  SessionModel = AccountSession,
  verifyIdentity = verifyFirebaseToken,
  ready = Promise.resolve(),
} = {}) {
  const router = express.Router();
  const wrap = (handler) => async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      await ready;
      await handler(req, res);
    } catch (error) {
      const status = error.status || (error.code === 11000 ? 409 : 500);
      res
        .status(status)
        .json({
          success: false,
          message: error.status
            ? error.message
            : error.code === 11000
              ? "This account already exists. Please sign in again."
              : "Your account is unavailable right now. Please try again.",
        });
    }
  };
  async function issueSession(user) {
    const token = randomBytes(32).toString("base64url");
    await SessionModel.create({
      tokenHash: tokenHash(token),
      userId: user._id,
      expiresAt: new Date(Date.now() + sessionDuration),
    });
    return { success: true, user: serializeUser(user), token };
  }
  async function authenticate(req) {
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(
      req.get("Authorization") || "",
    );
    if (!match) throw accountError(401, "Please sign in to view your account.");
    const hash = tokenHash(match[1]);
    const session = await SessionModel.findOne({
      tokenHash: hash,
      expiresAt: { $gt: new Date() },
    });
    if (!session)
      throw accountError(
        401,
        "Your session has expired. Please sign in again.",
      );
    const user = await UserModel.findById(session.userId);
    if (!user) throw accountError(401, "Please sign in again.");
    return { user, hash };
  }
  function credentials(body) {
    if (
      !body ||
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      !body.email.trim() ||
      !body.password ||
      body.email.length > 254 ||
      body.password.length > 1024
    ) {
      throw accountError(400, "Enter your email and password.");
    }
    return { email: body.email.trim(), password: body.password };
  }
  router.post(
    "/register",
    wrap(async (req, res) => {
      const { email, password } = credentials(req.body);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw accountError(400, "Enter a valid email address.");
      if (password !== req.body.confirmPassword)
        throw accountError(400, "Passwords do not match");
      if (await UserModel.findOne({ email }))
        throw accountError(409, "User already exists");
      const user = await UserModel.create({ email, password });
      res.json({
        success: true,
        message: "Registration successful",
        user: serializeUser(user),
      });
    }),
  );
  router.post(
    "/login",
    wrap(async (req, res) => {
      const { email, password } = credentials(req.body);
      const user = await UserModel.findOne({ email, password });
      if (!user) throw accountError(401, "Invalid email or Password");
      res.json(await issueSession(user));
    }),
  );
  for (const [endpoint, firebaseProvider, provider] of [
    ["google-login", "google.com", "google"],
    ["phone-login", "phone", "phone"],
  ]) {
    router.post(
      `/${endpoint}`,
      wrap(async (req, res) => {
        const identity = await verifyIdentity(
          req.body?.idToken,
          firebaseProvider,
        );
        let user = await UserModel.findOne({ uid: identity.localId });
        if (!user && firebaseProvider === "google.com") {
          user = await UserModel.findOne({ email: identity.email });
          if (user?.uid && user.uid !== identity.localId) {
            throw accountError(
              409,
              "This email is linked to another sign-in. Use your original sign-in method.",
            );
          }
        }
        if (!user) {
          user = await UserModel.create({
            uid: identity.localId,
            provider,
            ...(identity.email && identity.emailVerified
              ? { email: identity.email }
              : {}),
            name: identity.displayName || "",
            photoURL: identity.photoUrl || "",
            phone: identity.phoneNumber || "",
          });
        } else {
          // Refresh only verified identity metadata; keep profile edits across logins.
          const metadata = { uid: identity.localId };
          if (identity.photoUrl) metadata.photoURL = identity.photoUrl;
          if (!user.name && identity.displayName)
            metadata.name = identity.displayName;
          user = await UserModel.findByIdAndUpdate(
            user._id,
            { $set: metadata },
            { new: true },
          );
        }
        res.json(await issueSession(user));
      }),
    );
  }
  router.get(
    "/account",
    wrap(async (req, res) => {
      const { user } = await authenticate(req);
      res.json({ success: true, user: serializeUser(user) });
    }),
  );
  router.patch(
    "/account",
    wrap(async (req, res) => {
      const { user } = await authenticate(req);
      const fields = readProfileInput(req.body);
      const updated = await UserModel.findByIdAndUpdate(
        user._id,
        { $set: fields },
        { new: true, runValidators: true },
      );
      if (!updated) throw accountError(401, "Please sign in again.");
      res.json({ success: true, user: serializeUser(updated) });
    }),
  );
  router.post(
    "/logout",
    wrap(async (req, res) => {
      const { hash } = await authenticate(req);
      await SessionModel.deleteOne({ tokenHash: hash });
      res.json({ success: true });
    }),
  );
  return router;
}

module.exports = { createAccountRoutes, tokenHash };
