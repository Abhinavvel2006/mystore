const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test } = require("node:test");
const express = require("express");
const { createAccountRoutes, tokenHash } = require("../routes/account");
const {
  serializeUser,
  ensureUserIndexes,
} = require("../services/accountProfile");
const { verifyFirebaseToken } = require("../services/firebaseIdentity");

async function fixture(t, { verifyIdentity } = {}) {
  const users = [
    {
      _id: "one",
      email: "one@example.com",
      password: "secret",
      name: "First user",
      age: 24,
    },
    {
      _id: "two",
      email: "two@example.com",
      password: "another",
      name: "Other user",
    },
  ];
  const sessions = [];
  const UserModel = {
    async findOne(query) {
      return users.find((user) =>
        Object.entries(query).every(([key, value]) => user[key] === value),
      );
    },
    async findById(id) {
      return users.find((user) => user._id === id);
    },
    async create(fields) {
      const user = { _id: `new-${users.length}`, ...fields };
      users.push(user);
      return user;
    },
    async findByIdAndUpdate(id, { $set }) {
      const user = await this.findById(id);
      if (user) Object.assign(user, $set);
      return user;
    },
  };
  const SessionModel = {
    async create(session) {
      sessions.push(session);
      return session;
    },
    async findOne(query) {
      return sessions.find(
        (session) =>
          session.tokenHash === query.tokenHash &&
          session.expiresAt > query.expiresAt.$gt,
      );
    },
    async deleteOne(query) {
      const index = sessions.findIndex(
        (session) => session.tokenHash === query.tokenHash,
      );
      if (index >= 0) sessions.splice(index, 1);
    },
  };
  const app = express();
  app.use(express.json());
  app.use(
    "/api",
    createAccountRoutes({
      UserModel,
      SessionModel,
      ...(verifyIdentity ? { verifyIdentity } : {}),
    }),
  );
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  async function request(path, { token, body, method = "GET" } = {}) {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      },
    );
    return {
      status: response.status,
      body: await response.json(),
      cache: response.headers.get("Cache-Control"),
    };
  }
  async function login(email = "one@example.com", password = "secret") {
    return request("login", { method: "POST", body: { email, password } });
  }
  return { request, login, users, sessions };
}

test("login creates an opaque, hashed, expiring server session and only returns public profile fields", async (t) => {
  const { login, sessions } = await fixture(t);
  const result = await login();
  assert.equal(result.status, 200);
  assert.match(result.body.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(sessions[0].tokenHash, tokenHash(result.body.token));
  assert.equal(JSON.stringify(sessions).includes(result.body.token), false);
  assert.ok(sessions[0].expiresAt > Date.now());
  assert.equal(result.body.user.password, undefined);
  assert.equal(result.body.user._id, undefined);
  assert.equal(result.cache, "no-store");
});

test("credentials reject object injection, blank passwords and wrong passwords without issuing sessions", async (t) => {
  const { request, login, sessions } = await fixture(t);
  assert.equal((await login("one@example.com", "wrong")).status, 401);
  assert.equal((await login("one@example.com", "")).status, 400);
  assert.equal(
    (
      await request("login", {
        method: "POST",
        body: { email: { $ne: null }, password: { $ne: null } },
      })
    ).status,
    400,
  );
  assert.equal(sessions.length, 0);
});

test("account cannot be read or edited using an email or forged token", async (t) => {
  const { request, users } = await fixture(t);
  assert.equal((await request("account?email=one@example.com")).status, 401);
  assert.equal(
    (await request("account", { token: "a".repeat(43) })).status,
    401,
  );
  assert.equal(
    (
      await request("account", {
        method: "PATCH",
        body: { name: "Intruder", email: "one@example.com" },
      })
    ).status,
    401,
  );
  assert.equal(users[0].name, "First user");
});

test("profile updates persist, remain isolated to the session user, and survive another login", async (t) => {
  const { request, login, users } = await fixture(t);
  const token = (await login()).body.token;
  const fields = {
    name: " Updated name ",
    age: 36,
    location: "Chennai",
    phone: "+91 98765 43210",
    deliveryAddress: "12 Main Street",
    paymentMethod: "upi",
  };
  const updated = await request("account?email=two@example.com", {
    method: "PATCH",
    token,
    body: fields,
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.user.name, "Updated name");
  assert.equal(users[1].name, "Other user");
  const nextToken = (await login()).body.token;
  const loaded = await request("account", { token: nextToken });
  assert.equal(loaded.body.user.location, "Chennai");
  assert.equal(loaded.body.user.paymentMethod, "upi");
});

test("profile rejects immutable identity fields and raw payment information", async (t) => {
  const { request, login } = await fixture(t);
  const token = (await login()).body.token;
  for (const body of [
    { email: "other@example.com" },
    { uid: "other" },
    { provider: "google" },
    { photoURL: "https://invalid.test/x" },
    { password: "new" },
    { cardNumber: "1234567812345678" },
    { cvv: "123" },
  ]) {
    assert.equal(
      (await request("account", { method: "PATCH", token, body })).status,
      400,
    );
  }
});

test("a fresh account can save its payment preference before completing its name", async (t) => {
  const { request, login, users } = await fixture(t);
  users[0].name = "";
  const token = (await login()).body.token;
  const result = await request("account", {
    method: "PATCH",
    token,
    body: { paymentMethod: "card" },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.paymentMethod, "card");
  assert.equal(result.body.user.name, "");
});

test("profile validates age, contact number, names, lengths and payment choices", async (t) => {
  const { request, login } = await fixture(t);
  const token = (await login()).body.token;
  for (const body of [
    { age: 0 },
    { age: 121 },
    { age: 3.5 },
    { age: "24" },
    { age: true },
    { name: " " },
    { name: "x".repeat(81) },
    { location: "x".repeat(121) },
    { deliveryAddress: "x".repeat(501) },
    { phone: "123" },
    { phone: "1234567890123456" },
    { phone: "123abc456789" },
    { paymentMethod: "bitcoin" },
  ]) {
    assert.equal(
      (await request("account", { method: "PATCH", token, body })).status,
      400,
      JSON.stringify(body),
    );
  }
  assert.equal(
    (
      await request("account", {
        method: "PATCH",
        token,
        body: { age: "", phone: "", paymentMethod: "" },
      })
    ).body.user.age,
    null,
  );
});

test("expired and revoked sessions no longer authorize account access", async (t) => {
  const { request, login, sessions } = await fixture(t);
  const expired = (await login()).body.token;
  sessions[0].expiresAt = new Date(Date.now() - 1);
  assert.equal((await request("account", { token: expired })).status, 401);
  const token = (await login()).body.token;
  assert.equal(
    (await request("logout", { token, method: "POST" })).status,
    200,
  );
  assert.equal((await request("account", { token })).status, 401);
});

test("Google login requires verified identity and preserves saved profile on repeat logins", async (t) => {
  const { request, users } = await fixture(t, {
    verifyIdentity: async (token, provider) => {
      assert.equal(provider, "google.com");
      if (token !== "verified")
        throw Object.assign(new Error("Invalid token"), { status: 401 });
      return {
        localId: "firebase-one",
        email: "one@example.com",
        emailVerified: true,
        displayName: "Google name",
        photoUrl: "https://example.com/avatar.jpg",
      };
    },
  });
  assert.equal(
    (
      await request("google-login", {
        method: "POST",
        body: { email: "one@example.com", name: "Spoof" },
      })
    ).status,
    401,
  );
  const login = await request("google-login", {
    method: "POST",
    body: { idToken: "verified", email: "two@example.com" },
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.name, "First user");
  assert.equal(login.body.user.uid, "firebase-one");
  assert.ok(login.body.token);
  users[0].location = "Saved location";
  const again = await request("google-login", {
    method: "POST",
    body: { idToken: "verified" },
  });
  assert.equal(again.body.user.location, "Saved location");
  assert.equal(users.length, 2);
});

test("phone login creates independent users without fabricated email addresses", async (t) => {
  const { request, users } = await fixture(t, {
    verifyIdentity: async (idToken, provider) => {
      assert.equal(provider, "phone");
      return {
        localId: idToken,
        phoneNumber: idToken === "phone-a" ? "+919876543210" : "+919876543211",
      };
    },
  });
  for (const idToken of ["phone-a", "phone-b"]) {
    const result = await request("phone-login", {
      method: "POST",
      body: { idToken },
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.user.email, "");
    assert.equal(result.body.user.provider, "phone");
    assert.ok(result.body.token);
  }
  assert.equal(users.length, 4);
});

test("Google sign-in initializes a missing profile name from verified identity", async (t) => {
  const { request, users } = await fixture(t, {
    verifyIdentity: async () => ({
      localId: "firebase-one",
      email: "one@example.com",
      emailVerified: true,
      displayName: "Verified name",
    }),
  });
  users[0].name = "";
  const result = await request("google-login", {
    method: "POST",
    body: { idToken: "verified" },
  });
  assert.equal(result.body.user.name, "Verified name");
});

test("serialization is an explicit allowlist even when database records contain sensitive fields", () => {
  assert.deepEqual(
    Object.keys(
      serializeUser({
        _id: "id",
        password: "secret",
        tokenHash: "secret",
        unknown: "secret",
      }),
    ).sort(),
    [
      "name",
      "email",
      "phone",
      "provider",
      "uid",
      "photoURL",
      "age",
      "location",
      "deliveryAddress",
      "paymentMethod",
    ].sort(),
  );
});

const config = { apiKey: "public-test-key", projectId: "test-project" };
function firebaseToken(changes = {}) {
  const claims = {
    aud: config.projectId,
    iss: `https://securetoken.google.com/${config.projectId}`,
    sub: "uid",
    exp: 2000,
    iat: 900,
    auth_time: 900,
    firebase: { sign_in_provider: "google.com" },
    ...changes,
  };
  return `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
}
function lookupIdentity(changes = {}) {
  return {
    localId: "uid",
    email: "test@example.com",
    emailVerified: true,
    providerUserInfo: [{ providerId: "google.com" }],
    ...changes,
  };
}

test("Firebase verification requires successful remote verification, matching project and provider", async () => {
  let calls = 0;
  const fetchImpl = async (url, options) => {
    calls++;
    assert.ok(
      url.startsWith(
        "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=",
      ),
    );
    assert.equal(JSON.parse(options.body).idToken, firebaseToken());
    return {
      ok: true,
      status: 200,
      json: async () => ({ users: [lookupIdentity()] }),
    };
  };
  assert.equal(
    (
      await verifyFirebaseToken(firebaseToken(), "google.com", {
        config,
        fetchImpl,
        now: 1000000,
      })
    ).localId,
    "uid",
  );
  assert.equal(calls, 1);
  for (const change of [
    { aud: "another-project" },
    { iss: "https://wrong.example.com" },
    { exp: 999 },
    { firebase: { sign_in_provider: "phone" } },
    { auth_time: 1500 },
  ]) {
    await assert.rejects(
      verifyFirebaseToken(firebaseToken(change), "google.com", {
        config,
        fetchImpl,
        now: 1000000,
      }),
      { status: 401 },
    );
  }
  assert.equal(calls, 1);
});

test("Firebase verification rejects unsigned/invalid remote tokens, disabled users and UID mismatches", async () => {
  for (const [ok, identity] of [
    [false, lookupIdentity()],
    [true, lookupIdentity({ disabled: true })],
    [true, lookupIdentity({ localId: "other" })],
    [true, lookupIdentity({ emailVerified: false })],
  ]) {
    await assert.rejects(
      verifyFirebaseToken(firebaseToken(), "google.com", {
        config,
        now: 1000000,
        fetchImpl: async () => ({
          ok,
          status: ok ? 200 : 400,
          json: async () => ({ users: [identity] }),
        }),
      }),
      { status: 401 },
    );
  }
  for (const malformed of [
    "not-a-token",
    "header.bnVsbA.signature",
    "header.W10.signature",
  ]) {
    await assert.rejects(
      verifyFirebaseToken(malformed, "google.com", {
        config,
        now: 1000000,
        fetchImpl: async () => {
          throw new Error("Must not contact Firebase");
        },
      }),
      { status: 401 },
    );
  }
});

test("account index migration changes only the old email index and creates sparse identity indexes", async () => {
  const operations = [];
  await ensureUserIndexes({
    createCollection: async () => {},
    collection: {
      indexes: async () => [
        { name: "_id_", key: { _id: 1 } },
        { name: "email_1", key: { email: 1 }, unique: true },
      ],
      dropIndex: async (name) => operations.push(["drop", name]),
      createIndex: async (key, options) =>
        operations.push(["create", key, options]),
    },
  });
  assert.deepEqual(operations, [
    ["drop", "email_1"],
    ["create", { email: 1 }, { unique: true, sparse: true }],
    ["create", { uid: 1 }, { unique: true, sparse: true }],
  ]);
});
