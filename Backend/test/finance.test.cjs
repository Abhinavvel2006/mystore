const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test } = require("node:test");
const express = require("express");
const Expense = require("../model/expense");
const Revenue = require("../model/revenue");
const financeRoutes = require("../routes/finance");

async function request(t, path, options) {
  const app = express();
  app.use("/api", financeRoutes);
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, "listening");
  return fetch(`http://127.0.0.1:${server.address().port}${path}`, options);
}

function mockRecords(t, Model, records) {
  const query = {
    sort() {
      return this;
    },
    maxTimeMS() {
      return this;
    },
    async lean() {
      return records;
    },
  };
  t.mock.method(Model, "find", () => query);
}

test("finance models use the existing case-sensitive collections without creating them", () => {
  assert.equal(Expense.collection.collectionName, "Expense");
  assert.equal(Revenue.collection.collectionName, "Revenue");
  for (const Model of [Expense, Revenue]) {
    assert.equal(Model.schema.options.autoCreate, false);
    assert.equal(Model.schema.options.autoIndex, false);
    assert.equal(Model.schema.options.bufferCommands, false);
  }
});

test("an empty Expense collection returns an empty array", async (t) => {
  mockRecords(t, Expense, []);
  const response = await request(t, "/api/expenses");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), []);
});

test("revenue records are returned independently of expenses", async (t) => {
  const records = [
    {
      _id: "read-only-fixture",
      title: "Recorded income",
      source: "Sales",
      amount: 12.5,
    },
  ];
  mockRecords(t, Revenue, records);
  t.mock.method(Expense, "find", () => {
    throw new Error("Wrong collection queried");
  });
  const response = await request(t, "/api/revenues");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), records);
});

test("a database failure returns an error instead of a misleading empty ledger", async (t) => {
  t.mock.method(Expense, "find", () => {
    throw new Error("Database unavailable");
  });
  t.mock.method(console, "error", () => {});
  const response = await request(t, "/api/expenses");
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Financial records are unavailable. Please try again.",
  });
});

test("the finance router does not allow record creation", async (t) => {
  for (const resource of ["expenses", "revenues"]) {
    const response = await request(t, `/api/${resource}`, { method: "POST" });
    assert.equal(response.status, 404);
  }
});
