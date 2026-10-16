const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  readProductInput,
  productUpdateFilter,
} = require("../services/productInput");

test("product edits cannot remove inventory markers or use database operators", () => {
  for (const body of [
    { inventoryOrderIds: [] },
    { $unset: { inventoryOrderIds: 1 } },
    { $inc: { quantity: 10 } },
    { "inventoryOrderIds.0": "replacement" },
    { _id: "replacement", name: "Product" },
  ]) {
    assert.throws(() => readProductInput(body, { partial: true }), {
      status: 400,
    });
  }
});

test("stock quantities reject negatives and fractional units", () => {
  for (const quantity of [
    -1,
    0.5,
    "10",
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    assert.throws(() => readProductInput({ quantity }, { partial: true }), {
      status: 400,
    });
  }
  assert.deepEqual(readProductInput({ quantity: 9 }, { partial: true }), {
    quantity: 9,
  });
});

test("normal catalogue edits preserve only editable product fields", () => {
  assert.deepEqual(
    readProductInput({ name: " Headphone ", price: 700, quantity: 10 }),
    {
      name: "Headphone",
      price: 700,
      quantity: 10,
    },
  );
  assert.deepEqual(readProductInput({ name: "New name" }, { partial: true }), {
    name: "New name",
  });
});

test("intentional stock edits require an atomic expected-stock comparison", () => {
  assert.deepEqual(productUpdateFilter("product-id", { quantity: 15 }, "10"), {
    _id: "product-id",
    quantity: 10,
  });
  for (const expected of [undefined, "", "-1", "1.5", "NaN"]) {
    assert.throws(
      () => productUpdateFilter("product-id", { quantity: 15 }, expected),
      { status: 428 },
    );
  }
  assert.deepEqual(productUpdateFilter("product-id", { name: "New name" }), {
    _id: "product-id",
  });
});
