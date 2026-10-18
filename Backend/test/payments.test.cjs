const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
const { once } = require("node:events");
const { test } = require("node:test");
const express = require("express");

const PRODUCT_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const UNKNOWN_PRODUCT_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const SECOND_PRODUCT_ID = "cccccccccccccccccccccccc";
const KEY_ID = "rzp_test_fixture_public_key";
const KEY_SECRET = "fixture_secret_never_return_to_the_browser";
const WEBHOOK_SECRET = "fixture_webhook_secret";

function matches(record, filter = {}) {
  if (!record) return false;
  return Object.entries(filter).every(([key, expected]) => {
    if (key === "$or") return expected.some((item) => matches(record, item));
    if (key === "$and") return expected.every((item) => matches(record, item));
    const actual = key
      .split(".")
      .reduce((value, part) => value?.[part], record);
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      return Object.entries(expected).every(([operator, operand]) => {
        if (operator === "$in") return operand.includes(actual);
        if (operator === "$nin") return !operand.includes(actual);
        if (operator === "$ne")
          return Array.isArray(actual)
            ? !actual.some((value) => String(value) === String(operand))
            : actual !== operand;
        if (operator === "$eq") return actual === operand;
        if (operator === "$gte") return actual >= operand;
        if (operator === "$exists") return (actual !== undefined) === operand;
        throw new Error(`Unsupported fixture query operator: ${operator}`);
      });
    }
    return Array.isArray(actual)
      ? actual.some((value) => String(value) === String(expected))
      : String(actual) === String(expected);
  });
}

function query(operation) {
  let promise;
  const run = () => (promise ??= Promise.resolve().then(operation));
  return {
    lean() {
      return this;
    },
    select() {
      return this;
    },
    maxTimeMS() {
      return this;
    },
    sort() {
      return this;
    },
    cursor() {
      return {
        async *[Symbol.asyncIterator]() {
          for (const record of await run()) yield record;
        },
      };
    },
    exec: run,
    then(resolve, reject) {
      return run().then(resolve, reject);
    },
    catch(reject) {
      return run().catch(reject);
    },
  };
}

function makeModels() {
  const records = new Map();
  let sequence = 0;
  class Order {
    constructor(values) {
      Object.assign(this, {
        _id: (++sequence).toString(16).padStart(24, "0"),
        status: "Pending",
        createdAt: new Date().toISOString(),
        ...values,
      });
    }
    get id() {
      return this._id;
    }
    toObject() {
      return { ...this };
    }
    async save() {
      records.set(String(this._id), this);
      return this;
    }
    static async init() {
      return this;
    }
    static async create(values) {
      if (
        values.checkoutId &&
        [...records.values()].some(
          (item) => item.checkoutId === values.checkoutId,
        )
      ) {
        const error = new Error("Duplicate checkout");
        error.code = 11000;
        throw error;
      }
      return new this(values).save();
    }
    static find(filter) {
      return query(() =>
        [...records.values()].filter((item) => matches(item, filter)),
      );
    }
    static findById(id) {
      return query(() => records.get(String(id)) ?? null);
    }
    static findOne(filter) {
      return query(
        () =>
          [...records.values()].find((item) => matches(item, filter)) ?? null,
      );
    }
    static findByIdAndUpdate(id, update, options) {
      return this.findOneAndUpdate({ _id: id }, update, options);
    }
    static async updateOne(filter, update) {
      const record = await this.findOneAndUpdate(filter, update, { new: true });
      return {
        acknowledged: true,
        matchedCount: record ? 1 : 0,
        modifiedCount: record ? 1 : 0,
      };
    }
    static findOneAndUpdate(filter, update, options = {}) {
      return query(async () => {
        const record = [...records.values()].find((item) =>
          matches(item, filter),
        );
        if (!record) return null;
        const before = { ...record };
        for (const [key, value] of Object.entries(update)) {
          if (key === "$set") Object.assign(record, value);
          else if (key === "$unset")
            for (const field of Object.keys(value)) delete record[field];
          else if (key === "$inc")
            for (const [field, amount] of Object.entries(value))
              record[field] = (record[field] || 0) + amount;
          else if (key === "$setOnInsert") continue;
          else if (key.startsWith("$"))
            throw new Error(`Unsupported fixture update operator: ${key}`);
          else record[key] = value;
        }
        await record.save();
        return options.new || options.returnDocument === "after"
          ? record
          : before;
      });
    }
  }
  const products = [
    { _id: PRODUCT_ID, name: "Fixture product", price: 250, quantity: 12 },
  ];
  const Product = {
    find: (filter) =>
      query(() => products.filter((item) => matches(item, filter))),
    findById: (id) =>
      query(() => products.find((item) => item._id === String(id)) ?? null),
    findOne: (filter) =>
      query(() => products.find((item) => matches(item, filter)) ?? null),
    updateOne: (filter, update) =>
      query(() => {
        const product = products.find((item) => matches(item, filter));
        if (!product)
          return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
        for (const [key, value] of Object.entries(update)) {
          if (key === "$inc")
            for (const [field, amount] of Object.entries(value))
              product[field] = (product[field] || 0) + amount;
          else if (key === "$addToSet")
            for (const [field, item] of Object.entries(value)) {
              product[field] ??= [];
              if (
                !product[field].some((entry) => String(entry) === String(item))
              )
                product[field].push(item);
            }
          else throw new Error(`Unsupported product update operator: ${key}`);
        }
        return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
      }),
  };
  const revenues = new Map();
  const Revenue = {
    init: async () => Revenue,
    findOne: (filter) =>
      query(
        () =>
          [...revenues.values()].find((item) => matches(item, filter)) ?? null,
      ),
    findOneAndUpdate: (filter, update, options = {}) =>
      query(() => {
        let record = [...revenues.values()].find((item) =>
          matches(item, filter),
        );
        if (!record && options.upsert) {
          if (revenues.has(String(filter._id))) {
            const error = new Error("Duplicate revenue identifier");
            error.code = 11000;
            throw error;
          }
          record = { ...filter, ...update.$setOnInsert };
          revenues.set(String(record._id), record);
        }
        if (record && update.$set) Object.assign(record, update.$set);
        return record ?? null;
      }),
  };
  return { Order, Product, Revenue, records, products, revenues };
}

function makeGateway() {
  const payments = new Map();
  const calls = { create: [], fetch: [], capture: [] };
  const gateway = {
    orders: {
      async create(payload) {
        calls.create.push(structuredClone(payload));
        return {
          ...payload,
          id: `order_fixture${calls.create.length}`,
          status: "created",
        };
      },
    },
    payments: {
      async fetch(id) {
        calls.fetch.push(id);
        if (!payments.has(id)) throw new Error("Payment does not exist");
        return structuredClone(payments.get(id));
      },
      async capture(id, amount, currency) {
        calls.capture.push({ id, amount, currency });
        const payment = payments.get(id);
        assert.ok(payment, "Only existing payments can be captured");
        assert.equal(amount, payment.amount);
        if (currency !== undefined) assert.equal(currency, payment.currency);
        const captured = { ...payment, status: "captured", captured: true };
        payments.set(id, captured);
        return structuredClone(captured);
      },
    },
  };
  return { gateway, payments, calls };
}

async function fixture(t, overrides = {}, { useRealSdk = false } = {}) {
  const models = makeModels();
  const fake = makeGateway();
  const env = {
    RAZORPAY_KEY_ID: KEY_ID,
    RAZORPAY_KEY_SECRET: KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
    ...overrides,
  };
  const { createPaymentRoutes } = require("../routes/payments");
  const { router, webhook } = createPaymentRoutes({
    ...models,
    env,
    ...(useRealSdk ? {} : { gateway: fake.gateway }),
  });
  const app = express();
  app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    webhook,
  );
  app.use(express.json());
  app.use("/api", router);
  const server = app.listen(0, "127.0.0.1");
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  await once(server, "listening");
  async function request(path, { method = "GET", body, headers = {} } = {}) {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api${path}`,
      {
        method,
        headers: {
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...headers,
        },
        body:
          body === undefined
            ? undefined
            : typeof body === "string"
              ? body
              : JSON.stringify(body),
      },
    );
    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
    return { status: response.status, body: json, text };
  }
  const checkout = {
    userEmail: "shopper@example.test",
    customer: "Fixture Shopper",
    deliveryAddress: "12 Test Street, Chennai 600001",
    items: [{ productId: PRODUCT_ID, qty: 2 }],
  };
  async function create(overrides = {}, path = "/payments/orders") {
    return request(path, {
      method: "POST",
      body: { ...checkout, ...overrides },
    });
  }
  function payment(order, overrides = {}) {
    const value = {
      id: "pay_fixture1",
      order_id: order.razorpayOrderId,
      amount: order.amount,
      currency: "INR",
      status: "captured",
      captured: true,
      method: "upi",
      ...overrides,
    };
    fake.payments.set(value.id, value);
    return value;
  }
  function callback(order, value, overrides = {}) {
    return {
      orderId: order.orderId,
      razorpay_order_id: order.razorpayOrderId,
      razorpay_payment_id: value.id,
      razorpay_signature: createHmac("sha256", KEY_SECRET)
        .update(`${order.razorpayOrderId}|${value.id}`)
        .digest("hex"),
      ...overrides,
    };
  }
  async function verify(order, value, overrides = {}) {
    return request("/payments/verify", {
      method: "POST",
      body: callback(order, value, overrides),
    });
  }
  async function webhookRequest(event, overrides = {}) {
    const raw = JSON.stringify(event);
    return request("/payments/webhook", {
      method: "POST",
      body: raw,
      headers: {
        "x-razorpay-signature": createHmac("sha256", WEBHOOK_SECRET)
          .update(raw)
          .digest("hex"),
      },
      ...overrides,
    });
  }
  return {
    ...models,
    ...fake,
    env,
    request,
    checkout,
    create,
    payment,
    callback,
    verify,
    webhookRequest,
  };
}

function assertCreated(result) {
  assert.ok(
    [200, 201].includes(result.status),
    `${result.status}: ${result.text}`,
  );
  assert.equal(result.body.success, true);
  assert.ok(result.body.orderId);
  assert.ok(result.body.razorpayOrderId);
  return result.body;
}

function assertRejected(result) {
  assert.ok(
    result.status >= 400 && result.status < 500,
    `${result.status}: ${result.text}`,
  );
}

test("checkout config exposes only the public key and allowed payment methods", async (t) => {
  const f = await fixture(t);
  const result = await f.request("/payments/config");
  assert.equal(result.status, 200);
  assert.equal(result.body.keyId, KEY_ID);
  assert.equal(result.body.currency, "INR");
  assert.equal(result.body.maxAmount, null);
  assert.deepEqual(result.body.methods, {
    upi: true,
    card: true,
    netbanking: true,
    wallet: true,
    emi: true,
    paylater: false,
  });
  assert.deepEqual(
    result.body.methodLabels.map((item) => item.id),
    ["upi", "card", "netbanking", "wallet", "emi"],
  );
  assert.ok(!result.text.includes(KEY_SECRET));
  assert.ok(!result.text.includes(WEBHOOK_SECRET));
});

test("checkout methods can be restricted with backend configuration", async (t) => {
  const f = await fixture(t, { RAZORPAY_PAYMENT_METHODS: "upi,card" });
  const result = await f.request("/payments/config");
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.methods, {
    upi: true,
    card: true,
    netbanking: false,
    wallet: false,
    emi: false,
    paylater: false,
  });
  assert.deepEqual(
    result.body.methodLabels.map((item) => item.id),
    ["upi", "card"],
  );
});

test("missing credentials and unsupported methods fail closed without contacting the gateway", async (t) => {
  for (const overrides of [
    { RAZORPAY_KEY_SECRET: "" },
    { RAZORPAY_PAYMENT_METHODS: "upi,unsupported" },
  ]) {
    const f = await fixture(t, overrides);
    assert.equal((await f.request("/payments/config")).status, 503);
    assert.equal((await f.create()).status, 503);
    assert.equal(f.calls.create.length, 0);
  }
});

test("configured maximum is returned in paise and accepts the exact total boundary", async (t) => {
  const f = await fixture(t, { RAZORPAY_MAX_AMOUNT_INR: "550.00" });
  const config = await f.request("/payments/config");
  assert.equal(config.status, 200);
  assert.equal(config.body.maxAmount, 55000);
  const order = assertCreated(await f.create());
  assert.equal(order.amount, 55000);
  assert.equal(order.maxAmount, 55000);
  assert.equal(f.calls.create[0].amount, 55000);

  f.env.RAZORPAY_MAX_AMOUNT_INR = "550.05";
  assert.equal((await f.request("/payments/config")).body.maxAmount, 55005);
  f.env.RAZORPAY_MAX_AMOUNT_INR = "550.1";
  assert.equal((await f.request("/payments/config")).body.maxAmount, 55010);
});

test("amount limit includes server-calculated shipping and ignores forged client totals and limits", async (t) => {
  const f = await fixture(t, { RAZORPAY_MAX_AMOUNT_INR: "549.99" });
  const result = await f.create({
    total: 1,
    amount: 1,
    shipping: 0,
    maxAmount: 999999999,
    RAZORPAY_MAX_AMOUNT_INR: "999999999",
    items: [{ productId: PRODUCT_ID, qty: 2, price: 0.01 }],
  });
  assert.equal(result.status, 422, result.text);
  assert.equal(result.body.code, "PAYMENT_AMOUNT_LIMIT");
  assert.match(result.body.message, /shipping and tax/);
  assert.match(result.body.message, /549\.99/);
  assert.equal(f.calls.create.length, 0);
  assert.equal(f.records.size, 0);
});

test("an unset or blank maximum does not impose an invented Razorpay limit", async (t) => {
  for (const maximum of [undefined, "", "   "]) {
    const f = await fixture(t, { RAZORPAY_MAX_AMOUNT_INR: maximum });
    f.products[0].price = 200000;
    const config = await f.request("/payments/config");
    assert.equal(config.status, 200);
    assert.equal(config.body.maxAmount, null);
    const order = assertCreated(
      await f.create({ items: [{ productId: PRODUCT_ID, qty: 1 }] }),
    );
    assert.equal(order.amount, 22000000);
    assert.equal(f.calls.create[0].amount, 22000000);
  }
});

test("invalid maximum configuration fails closed before creating any order", async (t) => {
  const f = await fixture(t);
  for (const maximum of [
    "0", "0.00", "-100", "NaN", "Infinity", "1e5", "0x10",
    "1,00,000", "1.001", "100 INR", "9007199254740991",
  ]) {
    f.env.RAZORPAY_MAX_AMOUNT_INR = maximum;
    const config = await f.request("/payments/config");
    assert.equal(config.status, 503, maximum);
    assert.match(config.body.message, /configuration is invalid/);
    assert.equal((await f.create()).status, 503, maximum);
  }
  assert.equal(f.calls.create.length, 0);
  assert.equal(f.records.size, 0);
});

test("order creation uses database prices plus shipping and ignores forged totals and payment fields", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(
    await f.create({
      total: 1,
      amount: 1,
      status: "Delivered",
      paymentStatus: "paid",
      items: [
        { productId: PRODUCT_ID, qty: 2, price: 0.01, name: "Forged name" },
      ],
    }),
  );
  assert.equal(order.amount, 55000);
  assert.equal(order.currency, "INR");
  assert.equal(order.keyId, KEY_ID);
  assert.equal(f.calls.create.length, 1);
  assert.equal(f.calls.create[0].amount, 55000);
  assert.equal(f.calls.create[0].currency, "INR");
  const stored = f.records.get(String(order.orderId));
  assert.equal(stored.total, 550);
  assert.equal(stored.items[0].price, 250);
  assert.equal(stored.items[0].name, "Fixture product");
  assert.notEqual(stored.paymentStatus, "paid");
  assert.notEqual(stored.status, "Delivered");
});

test("legacy order creation endpoint also starts a verified gateway checkout", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create({}, "/orders"));
  assert.equal(order.amount, 55000);
  assert.notEqual(f.records.get(String(order.orderId)).paymentStatus, "paid");
});

test("the installed Razorpay SDK creates orders with a bounded request timeout", async (t) => {
  // Exercise the real SDK constructor and serialization, replacing only its
  // transport so this test cannot make a request to a payment service.
  const axios = require("axios").default;
  const createClient = axios.create.bind(axios);
  const requests = [];
  t.mock.method(axios, "create", (options) => {
    const client = createClient(options);
    client.defaults.adapter = async (config) => {
      const payload =
        typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      requests.push({
        method: config.method,
        url: config.url,
        timeout: config.timeout,
        payload,
      });
      return {
        data: { ...payload, id: "order_sdkfixture", status: "created" },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };
    return client;
  });
  const f = await fixture(t, {}, { useRealSdk: true });
  const order = assertCreated(await f.create());
  assert.equal(order.razorpayOrderId, "order_sdkfixture");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "post");
  assert.equal(requests[0].url, "/v1/orders");
  assert.equal(requests[0].payload.amount, 55000);
  assert.equal(requests[0].payload.currency, "INR");
  assert.ok(requests[0].timeout > 0 && requests[0].timeout <= 30000);
});

test("invalid quantities and unknown products never reach the payment provider", async (t) => {
  const f = await fixture(t);
  for (const items of [
    [],
    [{ productId: PRODUCT_ID, qty: 0 }],
    [{ productId: PRODUCT_ID, qty: -1 }],
    [{ productId: PRODUCT_ID, qty: 1.5 }],
    [{ productId: PRODUCT_ID, qty: 101 }],
    [{ productId: PRODUCT_ID, qty: 13 }],
    [
      { productId: PRODUCT_ID, qty: 7 },
      { productId: PRODUCT_ID, qty: 7 },
    ],
    [{ productId: "not-an-object-id", qty: 1 }],
    [{ productId: UNKNOWN_PRODUCT_ID, qty: 1 }],
  ])
    assertRejected(await f.create({ items }));
  assert.equal(f.calls.create.length, 0);
  assert.equal(f.records.size, 0);
});

test("checkout requires valid contact and delivery details before creating orders", async (t) => {
  const f = await fixture(t);
  for (const body of [
    { userEmail: "" },
    { userEmail: "invalid-email" },
    { deliveryAddress: "   " },
    { deliveryAddress: "x".repeat(2001) },
    { checkoutId: "too-short" },
  ])
    assertRejected(await f.create(body));
  assert.equal(f.calls.create.length, 0);
  assert.equal(f.records.size, 0);
});

test("retrying the same checkout reuses its payment order and rejects a changed cart", async (t) => {
  const f = await fixture(t);
  const checkoutId = "checkout_retry_fixture_001";
  const first = assertCreated(await f.create({ checkoutId }));
  const second = assertCreated(await f.create({ checkoutId }));
  assert.equal(second.orderId, first.orderId);
  assert.equal(second.razorpayOrderId, first.razorpayOrderId);
  assert.equal(f.calls.create.length, 1);
  assert.equal(f.records.size, 1);
  assert.equal(
    (await f.create({ checkoutId, items: [{ productId: PRODUCT_ID, qty: 1 }] }))
      .status,
    409,
  );
  assert.equal(f.calls.create.length, 1);
});

test("a checkout retry recovers payment confirmed by webhook without charging again", async (t) => {
  const f = await fixture(t);
  const checkoutId = "checkout_paid_retry_fixture_001";
  const first = assertCreated(await f.create({ checkoutId }));
  const value = f.payment(first);
  const webhook = await f.webhookRequest({
    event: "payment.captured",
    payload: { payment: { entity: value } },
  });
  assert.equal(webhook.status, 200, webhook.text);
  const stored = f.records.get(String(first.orderId));
  stored.status = "Delivered";
  const providerCalls = structuredClone(f.calls);

  const retry = await f.create({ checkoutId });
  const recovered = assertCreated(retry);
  assert.equal(retry.status, 200);
  assert.equal(recovered.alreadyPaid, true);
  assert.equal(recovered.orderId, first.orderId);
  assert.equal(recovered.razorpayOrderId, first.razorpayOrderId);
  assert.equal(recovered.order.paymentStatus, "paid");
  assert.equal(recovered.order.status, "Delivered");
  assert.equal(f.records.size, 1);
  assert.deepEqual(f.calls, providerCalls);
});

test("lowering the maximum blocks reuse of an unpaid checkout but preserves payment verification and recovery", async (t) => {
  const f = await fixture(t);
  const checkoutId = "checkout_changed_limit_001";
  const first = assertCreated(await f.create({ checkoutId }));
  f.env.RAZORPAY_MAX_AMOUNT_INR = "500";
  const blocked = await f.create({ checkoutId });
  assert.equal(blocked.status, 422, blocked.text);
  assert.equal(blocked.body.code, "PAYMENT_AMOUNT_LIMIT");
  assert.equal(f.calls.create.length, 1);
  assert.equal(f.records.size, 1);

  // A customer may have paid before the limit changed. Always allow confirmation.
  assert.equal((await f.verify(first, f.payment(first))).status, 200);
  const recovered = assertCreated(await f.create({ checkoutId }));
  assert.equal(recovered.alreadyPaid, true);
  assert.equal(recovered.orderId, first.orderId);
  assert.equal(recovered.order.paymentStatus, "paid");
  assert.equal(f.calls.create.length, 1);
});

test("failed gateway creation releases the checkout reference and redacts provider errors", async (t) => {
  const f = await fixture(t);
  const originalCreate = f.gateway.orders.create;
  f.gateway.orders.create = async () => {
    throw new Error(`Provider leaked ${KEY_SECRET}`);
  };
  const checkoutId = "checkout_failure_fixture_001";
  const failure = await f.create({ checkoutId });
  assert.equal(failure.status, 503);
  assert.ok(!failure.text.includes(KEY_SECRET));
  assert.ok(
    [...f.records.values()].every((order) => order.checkoutId !== checkoutId),
  );
  const failed = [...f.records.values()][0];
  assert.equal(failed.status, "Payment setup failed");
  assert.equal(failed.paymentStatus, "failed");
  assert.equal(failed.razorpayOrderId, undefined);
  f.gateway.orders.create = originalCreate;
  const retry = assertCreated(await f.create({ checkoutId }));
  assert.equal(retry.order.paymentStatus, "pending");
  assert.equal(retry.order.status, "Awaiting payment");
  assert.notEqual(retry.orderId, failed._id);
});

test("provider amount-limit errors become safe actionable errors and failed setup records", async (t) => {
  for (const description of [
    "Amount exceeds maximum amount allowed.",
    "Order amount exceeds the allowed transaction limit.",
  ]) {
    const f = await fixture(t);
    const originalCreate = f.gateway.orders.create;
    f.gateway.orders.create = async () => {
      throw {
        statusCode: 400,
        error: {
          code: "BAD_REQUEST_ERROR",
          description,
          request: { authorization: KEY_SECRET },
        },
      };
    };
    const checkoutId = "checkout_provider_limit_001";
    const result = await f.create({ checkoutId });
    assert.equal(result.status, 422, result.text);
    assert.equal(result.body.code, "PAYMENT_AMOUNT_LIMIT");
    assert.match(result.body.message, /Reduce your cart total or contact the store/);
    assert.ok(!result.text.includes(KEY_SECRET));
    assert.ok(!result.text.includes(description));
    const failed = [...f.records.values()][0];
    assert.equal(failed.status, "Payment setup failed");
    assert.equal(failed.paymentStatus, "failed");
    assert.equal(failed.checkoutId, undefined);
    assert.equal(failed.razorpayOrderId, undefined);
    assert.equal(f.products[0].quantity, 12);
    assert.equal(f.revenues.size, 0);
    f.gateway.orders.create = originalCreate;
    assertCreated(await f.create({ checkoutId }));
  }
});

test("unrelated provider errors remain redacted without being labelled as amount limits", async (t) => {
  const f = await fixture(t);
  for (const description of [
    `Invalid API credentials: ${KEY_SECRET}`,
    `Request rate limit exceeded: ${KEY_SECRET}`,
    `Amount must be at least INR 1: ${KEY_SECRET}`,
  ]) {
    f.gateway.orders.create = async () => {
      throw {
        status: 400,
        statusCode: 400,
        message: description,
        error: { code: "BAD_REQUEST_ERROR", description },
      };
    };
    const result = await f.create();
    assert.equal(result.status, 503, result.text);
    assert.equal(result.body.code, undefined);
    assert.ok(!result.text.includes(KEY_SECRET));
    assert.ok(!result.text.includes(description));
  }
});

test("gateway order with an unexpected amount is never exposed as a valid checkout", async (t) => {
  const f = await fixture(t);
  const originalCreate = f.gateway.orders.create;
  f.gateway.orders.create = async (payload) => ({
    ...(await originalCreate(payload)),
    amount: 1,
  });
  const checkoutId = "checkout_invalid_provider_001";
  const result = await f.create({ checkoutId });
  assert.equal(result.status, 502);
  assert.ok(
    [...f.records.values()].every(
      (order) => !order.razorpayOrderId && order.checkoutId !== checkoutId,
    ),
  );
});

test("a captured payment with a valid signature marks the server order paid", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const result = await f.verify(order, f.payment(order));
  assert.equal(result.status, 200, result.text);
  const stored = f.records.get(String(order.orderId));
  assert.equal(stored.paymentStatus, "paid");
  assert.equal(stored.status, "Pending");
  assert.equal(stored.paymentMethod, "upi");
  assert.equal(f.calls.capture.length, 0);
});

test("a paid one-unit order reduces ten available units to nine and records the received total", async (t) => {
  const f = await fixture(t);
  Object.assign(f.products[0], { name: "Headphone", price: 700, quantity: 10 });
  const order = assertCreated(
    await f.create({ items: [{ productId: PRODUCT_ID, qty: 1 }] }),
  );
  assert.equal(
    f.products[0].quantity,
    10,
    "Opening checkout does not sell stock",
  );
  assert.equal(f.revenues.size, 0, "An unpaid checkout is not revenue");

  const result = await f.verify(order, f.payment(order, { method: "wallet" }));
  assert.equal(result.status, 200, result.text);
  assert.equal(f.products[0].quantity, 9);
  const stored = f.records.get(String(order.orderId));
  assert.equal(stored.paymentStatus, "paid");
  assert.equal(stored.inventoryStatus, "deducted");
  assert.ok(stored.effectsAppliedAt);
  assert.equal(f.revenues.size, 1);
  const revenue = [...f.revenues.values()][0];
  assert.equal(revenue.orderId, order.orderId);
  assert.equal(revenue.amount, 770);
  assert.equal(revenue.currency, "INR");
  assert.equal(revenue.paymentMethod, "wallet");
  assert.equal(revenue.razorpayPaymentId, "pay_fixture1");
});

test("authorized payments are captured for the full server amount before settlement", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const result = await f.verify(
    order,
    f.payment(order, { status: "authorized", captured: false, method: "card" }),
  );
  assert.equal(result.status, 200, result.text);
  assert.equal(f.calls.capture.length, 1);
  assert.equal(f.calls.capture[0].amount, 55000);
  assert.equal(f.records.get(String(order.orderId)).paymentStatus, "paid");
});

test("malformed or forged signatures cannot mark an order paid or call capture", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const value = f.payment(order, { status: "authorized", captured: false });
  for (const razorpay_signature of [
    "",
    "not-hex",
    "0".repeat(64),
    "a".repeat(63),
    "a".repeat(66),
  ]) {
    assertRejected(await f.verify(order, value, { razorpay_signature }));
  }
  assert.notEqual(f.records.get(String(order.orderId)).paymentStatus, "paid");
  assert.equal(f.calls.capture.length, 0);
});

test("callback cannot substitute a different gateway order even with its matching signature", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const value = f.payment(order);
  const differentOrder = "order_attacker";
  const result = await f.verify(order, value, {
    razorpay_order_id: differentOrder,
    razorpay_signature: createHmac("sha256", KEY_SECRET)
      .update(`${differentOrder}|${value.id}`)
      .digest("hex"),
  });
  assertRejected(result);
  assert.notEqual(f.records.get(String(order.orderId)).paymentStatus, "paid");
});

test("provider amount, currency and order must all match before settlement", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  for (const mismatch of [
    { amount: 54999 },
    { amount: 55001 },
    { currency: "USD" },
    { order_id: "order_different" },
  ]) {
    assertRejected(await f.verify(order, f.payment(order, mismatch)));
    assert.notEqual(f.records.get(String(order.orderId)).paymentStatus, "paid");
  }
  assert.equal(f.calls.capture.length, 0);
});

test("uncaptured pending payments remain unpaid and return a retryable response", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const result = await f.verify(
    order,
    f.payment(order, { status: "created", captured: false }),
  );
  assert.equal(result.status, 202, result.text);
  assert.notEqual(f.records.get(String(order.orderId)).paymentStatus, "paid");
  assert.equal(f.products[0].quantity, 12);
  assert.equal(f.revenues.size, 0);
});

test("a failed capture does not turn an authorized payment into a paid order", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const value = f.payment(order, { status: "authorized", captured: false });
  f.gateway.payments.capture = async () => {
    throw new Error("Capture unavailable");
  };
  const result = await f.verify(order, value);
  assert.equal(result.status, 202, result.text);
  assert.notEqual(f.records.get(String(order.orderId)).paymentStatus, "paid");
  assert.equal(f.calls.fetch.length, 2);
  assert.equal(f.products[0].quantity, 12);
  assert.equal(f.revenues.size, 0);
});

test("verification recovers when automatic capture wins a concurrent capture request", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const value = f.payment(order, { status: "authorized", captured: false });
  f.gateway.payments.capture = async () => {
    f.payments.set(value.id, { ...value, status: "captured", captured: true });
    throw new Error("Already captured by the provider");
  };
  const result = await f.verify(order, value);
  assert.equal(result.status, 200, result.text);
  assert.equal(f.records.get(String(order.orderId)).paymentStatus, "paid");
});

test("captured status without the provider's capture confirmation remains unpaid", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const result = await f.verify(
    order,
    f.payment(order, { status: "captured", captured: false }),
  );
  assert.equal(result.status, 202);
  assert.notEqual(f.records.get(String(order.orderId)).paymentStatus, "paid");
});

test("repeated verification preserves an order's later fulfillment status", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const value = f.payment(order);
  assert.equal((await f.verify(order, value)).status, 200);
  const stored = f.records.get(String(order.orderId));
  stored.status = "Delivered";
  assert.equal((await f.verify(order, value)).status, 200);
  assert.equal(stored.status, "Delivered");
  assert.equal(stored.paymentStatus, "paid");
  assert.equal(f.products[0].quantity, 10);
  assert.equal(f.revenues.size, 1);
});

test("a settled order cannot be reassigned to another validly signed payment", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const original = f.payment(order);
  assert.equal((await f.verify(order, original)).status, 200);
  const replacement = f.payment(order, { id: "pay_replacement" });
  assert.equal((await f.verify(order, replacement)).status, 409);
  assert.equal(
    f.records.get(String(order.orderId)).razorpayPaymentId,
    original.id,
  );
});

test("ordinary order updates cannot forge payment or fulfill an unpaid checkout", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  for (const body of [
    { paymentStatus: "paid" },
    { status: "Delivered" },
    { status: "Packed" },
    { status: "Paid" },
    { razorpayPaymentId: "pay_forged" },
    { total: 1 },
  ])
    assertRejected(
      await f.request(`/orders/${order.orderId}`, { method: "PUT", body }),
    );
  assert.notEqual(f.records.get(String(order.orderId)).paymentStatus, "paid");
  assert.notEqual(f.records.get(String(order.orderId)).status, "Delivered");
});

test("a paid checkout accepts normal fulfillment changes", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  assert.equal((await f.verify(order, f.payment(order))).status, 200);
  const result = await f.request(`/orders/${order.orderId}`, {
    method: "PUT",
    body: { status: "Packed" },
  });
  assert.equal(result.status, 200, result.text);
  assert.equal(f.records.get(String(order.orderId)).status, "Packed");
});

test("signed raw payment webhook settles once and duplicate delivery preserves fulfillment", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const value = f.payment(order);
  const event = {
    event: "payment.captured",
    payload: { payment: { entity: value } },
  };
  assert.equal((await f.webhookRequest(event)).status, 200);
  const stored = f.records.get(String(order.orderId));
  assert.equal(stored.paymentStatus, "paid");
  stored.status = "Packed";
  assert.equal((await f.webhookRequest(event)).status, 200);
  assert.equal(stored.status, "Packed");
  assert.equal(stored.paymentStatus, "paid");
  assert.equal(f.products[0].quantity, 10);
  assert.equal(f.revenues.size, 1);
});

test("concurrent callbacks, webhook retries and checkout recovery apply stock and revenue once", async (t) => {
  const f = await fixture(t);
  const checkoutId = "checkout_concurrent_effects_001";
  const order = assertCreated(await f.create({ checkoutId }));
  const value = f.payment(order);
  const event = {
    event: "payment.captured",
    payload: { payment: { entity: value } },
  };
  const results = await Promise.all([
    f.verify(order, value),
    f.webhookRequest(event),
    f.verify(order, value),
    f.webhookRequest(event),
  ]);
  for (const result of results) assert.equal(result.status, 200, result.text);
  const recovered = assertCreated(await f.create({ checkoutId }));
  assert.equal(recovered.alreadyPaid, true);
  assert.equal(f.products[0].quantity, 10);
  assert.equal(f.revenues.size, 1);
  assert.equal([...f.revenues.values()][0].amount, 550);
  assert.equal(f.calls.create.length, 1);
});

test("settlement deducts every product and combines repeated cart lines", async (t) => {
  const f = await fixture(t);
  f.products.push({
    _id: SECOND_PRODUCT_ID,
    name: "Second fixture product",
    price: 100,
    quantity: 8,
  });
  const order = assertCreated(
    await f.create({
      items: [
        { productId: PRODUCT_ID, qty: 2 },
        { productId: SECOND_PRODUCT_ID, qty: 3 },
        { productId: PRODUCT_ID, qty: 1 },
      ],
    }),
  );
  const value = f.payment(order);
  assert.equal((await f.verify(order, value)).status, 200);
  assert.equal((await f.verify(order, value)).status, 200);
  assert.equal(f.products[0].quantity, 9);
  assert.equal(f.products[1].quantity, 5);
  assert.equal(f.revenues.size, 1);
  assert.equal([...f.revenues.values()][0].amount, 1155);
});

test("two paid checkouts competing for stock never oversell and preserve both received payments", async (t) => {
  const f = await fixture(t);
  f.products[0].quantity = 2;
  const first = assertCreated(await f.create());
  const second = assertCreated(await f.create());
  const results = await Promise.all([
    f.verify(first, f.payment(first, { id: "pay_competing1" })),
    f.verify(second, f.payment(second, { id: "pay_competing2" })),
  ]);
  for (const result of results) assert.equal(result.status, 200, result.text);
  assert.equal(f.products[0].quantity, 0);
  const orders = [...f.records.values()];
  assert.ok(orders.every((order) => order.paymentStatus === "paid"));
  assert.equal(
    orders.filter((order) => order.inventoryStatus === "deducted").length,
    1,
  );
  assert.equal(
    orders.filter((order) => order.inventoryStatus === "attention").length,
    1,
  );
  assert.equal(f.revenues.size, 2);
  assert.equal(
    [...f.revenues.values()].reduce((sum, entry) => sum + entry.amount, 0),
    1100,
  );
});

test("a stock shortage keeps payment recorded, blocks fulfillment and can recover after restocking", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  f.products[0].quantity = 1;
  const value = f.payment(order);
  const result = await f.verify(order, value);
  assert.equal(result.status, 200, result.text);
  const stored = f.records.get(String(order.orderId));
  assert.equal(stored.paymentStatus, "paid");
  assert.equal(stored.inventoryStatus, "attention");
  assert.ok(stored.inventoryIssues.length > 0);
  assert.ok(!stored.effectsAppliedAt);
  assert.equal(f.products[0].quantity, 1);
  assert.equal(f.revenues.size, 1);
  assert.equal([...f.revenues.values()][0].amount, 550);
  const fulfillment = await f.request(`/orders/${order.orderId}`, {
    method: "PUT",
    body: { status: "Packed" },
  });
  assert.equal(fulfillment.status, 409, fulfillment.text);

  f.products[0].quantity = 5;
  assert.equal((await f.verify(order, value)).status, 200);
  assert.equal(f.products[0].quantity, 3);
  assert.equal(stored.inventoryStatus, "deducted");
  assert.deepEqual(stored.inventoryIssues, []);
  assert.ok(stored.effectsAppliedAt);
  assert.equal(f.revenues.size, 1);
  assert.equal(
    (
      await f.request(`/orders/${order.orderId}`, {
        method: "PUT",
        body: { status: "Packed" },
      })
    ).status,
    200,
  );
});

test("verification repairs an existing paid order while preserving manually recorded revenue", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const value = f.payment(order);
  const stored = f.records.get(String(order.orderId));
  Object.assign(stored, {
    paymentStatus: "paid",
    razorpayPaymentId: value.id,
    paymentMethod: "upi",
    paidAt: new Date("2026-10-16T12:00:00.000Z"),
    status: "Packed",
  });
  const manualRevenue = {
    _id: "dddddddddddddddddddddddd",
    title: "Separate manual income",
    source: "Manual entry",
    amount: 100,
    date: "2026-10-15",
  };
  f.revenues.set(manualRevenue._id, structuredClone(manualRevenue));
  assert.equal((await f.verify(order, value)).status, 200);
  assert.equal(f.products[0].quantity, 10);
  assert.equal(stored.status, "Packed");
  assert.equal(stored.inventoryStatus, "deducted");
  assert.equal(f.revenues.size, 2);
  assert.deepEqual(f.revenues.get(manualRevenue._id), manualRevenue);
  assert.equal(
    f.calls.fetch.length,
    0,
    "Previously verified payment is not charged again",
  );
});

test("retrying an existing paid checkout repairs its missing stock and revenue records", async (t) => {
  const f = await fixture(t);
  const checkoutId = "checkout_legacy_paid_repair_001";
  const order = assertCreated(await f.create({ checkoutId }));
  const stored = f.records.get(String(order.orderId));
  Object.assign(stored, {
    paymentStatus: "paid",
    razorpayPaymentId: "pay_previouslyverified",
    paymentMethod: "wallet",
    paidAt: new Date(),
    status: "Delivered",
  });
  const recovered = assertCreated(await f.create({ checkoutId }));
  assert.equal(recovered.alreadyPaid, true);
  assert.equal(f.products[0].quantity, 10);
  assert.equal(f.revenues.size, 1);
  assert.equal(stored.status, "Delivered");
  assert.equal(stored.inventoryStatus, "deducted");
  assert.equal(f.calls.create.length, 1);
  assert.equal(f.calls.fetch.length, 0);
});

test("a retry after inventory was committed but completion failed does not subtract stock twice", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const value = f.payment(order);
  const originalUpdate = f.Order.findOneAndUpdate;
  f.Order.findOneAndUpdate = function (filter, update, options) {
    if (update.$set?.effectsAppliedAt)
      throw new Error("Database unavailable while saving completion");
    return originalUpdate.call(this, filter, update, options);
  };
  const failed = await f.verify(order, value);
  assert.equal(failed.status, 503, failed.text);
  const stored = f.records.get(String(order.orderId));
  assert.equal(stored.paymentStatus, "paid");
  assert.ok(!stored.effectsAppliedAt);
  assert.equal(f.products[0].quantity, 10);
  assert.equal(f.revenues.size, 1);

  f.Order.findOneAndUpdate = originalUpdate;
  const recovered = await f.verify(order, value);
  assert.equal(recovered.status, 200, recovered.text);
  assert.equal(f.products[0].quantity, 10);
  assert.equal(f.revenues.size, 1);
  assert.equal(stored.inventoryStatus, "deducted");
  assert.ok(stored.effectsAppliedAt);
});

test("temporary revenue persistence failure can be retried without losing a captured payment", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const value = f.payment(order);
  const originalUpsert = f.Revenue.findOneAndUpdate;
  f.Revenue.findOneAndUpdate = async () => {
    throw new Error("Revenue database unavailable");
  };
  const failed = await f.verify(order, value);
  assert.equal(failed.status, 503, failed.text);
  assert.equal(f.records.get(String(order.orderId)).paymentStatus, "paid");
  assert.equal(f.revenues.size, 0);

  f.Revenue.findOneAndUpdate = originalUpsert;
  const recovered = await f.verify(order, value);
  assert.equal(recovered.status, 200, recovered.text);
  assert.equal(f.products[0].quantity, 10);
  assert.equal(f.revenues.size, 1);
  assert.ok(f.records.get(String(order.orderId)).effectsAppliedAt);
  assert.equal(
    f.calls.fetch.length,
    1,
    "A paid retry uses its verified saved payment",
  );
});

test("reconciliation repairs existing paid orders once and leaves pending checkouts unchanged", async (t) => {
  const f = await fixture(t);
  const paidCheckout = assertCreated(await f.create());
  const pendingCheckout = assertCreated(await f.create());
  const paid = f.records.get(String(paidCheckout.orderId));
  Object.assign(paid, {
    paymentStatus: "paid",
    razorpayPaymentId: "pay_previouslyverified",
    paymentMethod: "wallet",
    paidAt: new Date(),
    status: "Packed",
  });
  const { createPaidOrderEffects } = require("../services/paidOrderEffects");
  const effects = createPaidOrderEffects(f);
  assert.deepEqual(await effects.reconcile(), {
    completed: 1,
    attention: 0,
    failed: 0,
  });
  assert.deepEqual(await effects.reconcile(), {
    completed: 0,
    attention: 0,
    failed: 0,
  });
  assert.equal(f.products[0].quantity, 10);
  assert.equal(f.revenues.size, 1);
  assert.equal(paid.status, "Packed");
  assert.equal(paid.inventoryStatus, "deducted");
  assert.equal(
    f.records.get(String(pendingCheckout.orderId)).paymentStatus,
    "pending",
  );
});

test("a stale stock-shortage result cannot overwrite a concurrent completed settlement", async (t) => {
  const f = await fixture(t);
  const checkout = assertCreated(await f.create());
  const paid = f.records.get(String(checkout.orderId));
  Object.assign(paid, {
    paymentStatus: "paid",
    razorpayPaymentId: "pay_previouslyverified",
    paymentMethod: "upi",
    paidAt: new Date(),
    status: "Pending",
  });
  const staleSnapshot = { ...paid };
  f.products[0].quantity = 1;
  const { createPaidOrderEffects } = require("../services/paidOrderEffects");
  const effects = createPaidOrderEffects(f);
  const originalUpdate = f.Order.findOneAndUpdate;
  let finishConcurrentSettlement = true;
  f.Order.findOneAndUpdate = async function (filter, update, options) {
    if (
      finishConcurrentSettlement &&
      update.$set?.inventoryStatus === "attention"
    ) {
      finishConcurrentSettlement = false;
      f.products[0].quantity = 5;
      await effects.apply({ ...paid });
    }
    return originalUpdate.call(this, filter, update, options);
  };

  const result = await effects.apply(staleSnapshot);
  assert.equal(result.inventoryStatus, "deducted");
  assert.equal(paid.inventoryStatus, "deducted");
  assert.deepEqual(paid.inventoryIssues, []);
  assert.ok(paid.effectsAppliedAt);
  assert.equal(f.products[0].quantity, 3);
  assert.equal(f.revenues.size, 1);
});

test("webhook rejects tampered raw bytes and does not trust claimed capture status", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const value = f.payment(order, { amount: 1 });
  const event = {
    event: "payment.captured",
    payload: { payment: { entity: { ...value, amount: order.amount } } },
  };
  const original = JSON.stringify(event);
  const tampered = await f.webhookRequest(event, {
    body: `${original} `,
    headers: {
      "x-razorpay-signature": createHmac("sha256", WEBHOOK_SECRET)
        .update(original)
        .digest("hex"),
    },
  });
  assertRejected(tampered);
  assert.notEqual(f.records.get(String(order.orderId)).paymentStatus, "paid");
  const signedButMismatched = await f.webhookRequest(event);
  assert.ok(signedButMismatched.status >= 400, signedButMismatched.text);
  assert.notEqual(f.records.get(String(order.orderId)).paymentStatus, "paid");
});

test("order.paid webhook verifies the linked payment before settling", async (t) => {
  const f = await fixture(t);
  const order = assertCreated(await f.create());
  const value = f.payment(order);
  const event = {
    event: "order.paid",
    payload: {
      payment: { entity: value },
      order: {
        entity: {
          id: order.razorpayOrderId,
          amount: order.amount,
          currency: "INR",
          status: "paid",
        },
      },
    },
  };
  const result = await f.webhookRequest(event);
  assert.equal(result.status, 200, result.text);
  assert.ok(f.calls.fetch.includes(value.id));
  assert.equal(f.records.get(String(order.orderId)).paymentStatus, "paid");
});
