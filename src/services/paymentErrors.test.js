import assert from "node:assert/strict";
import test from "node:test";
import { isPaymentAmountLimit, paymentErrorMessage } from "./paymentErrors.js";

test("recognizes the Razorpay maximum amount error irrespective of case", () => {
  const error = new Error("AMOUNT EXCEEDS MAXIMUM AMOUNT ALLOWED.");
  assert.equal(isPaymentAmountLimit(error), true);
  assert.equal(
    paymentErrorMessage(error),
    "This order total exceeds a payment limit allowed by Razorpay. Please contact the store for help.",
  );
});

test("recognizes a structured backend code and formats paise as INR", () => {
  const error = Object.assign(new Error("Payment could not be started."), {
    code: "PAYMENT_AMOUNT_LIMIT",
  });
  assert.equal(isPaymentAmountLimit(error), true);
  assert.equal(
    paymentErrorMessage(error, 22000000),
    "This order total (₹2,20,000.00) exceeds a payment limit allowed by Razorpay. Please contact the store for help.",
  );
  assert.match(paymentErrorMessage(error, 3850050), /₹38,500\.50/);
  assert.match(paymentErrorMessage(error, 220000), /₹2,200\.00/);
});

test("does not invent an amount for absent or invalid paise values", () => {
  const error = { code: "PAYMENT_AMOUNT_LIMIT" };
  for (const value of [
    undefined,
    null,
    NaN,
    Infinity,
    -1,
    0,
    100.5,
    "22000000",
  ]) {
    assert.equal(paymentErrorMessage(error, value).includes("₹"), false);
  }
});

test("gives EMI-specific guidance without claiming a merchant account cap", () => {
  const error = {
    code: "BAD_REQUEST_ERROR",
    reason: "emi_greater_than_max_amount",
    description: "Payment failed.",
  };
  assert.equal(isPaymentAmountLimit(error), true);
  assert.equal(
    paymentErrorMessage(error, 22000000),
    "This amount exceeds the limit for the selected EMI option. Please choose another eligible payment method.",
  );
});

test("retains issuer-specific guidance for card or bank amount limits", () => {
  const error = {
    description:
      "The payment amount exceeds the maximum limit set by your card issuer.",
  };
  assert.equal(isPaymentAmountLimit(error), true);
  assert.match(
    paymentErrorMessage(error),
    /another eligible payment method or contact your bank/,
  );
  assert.doesNotMatch(paymentErrorMessage(error), /store|merchant/);
});

test("accepts Razorpay checkout errors and narrowly matches amount descriptions", () => {
  assert.equal(
    isPaymentAmountLimit({
      error: { description: "Amount exceeds maximum amount allowed." },
    }),
    true,
  );
  assert.equal(
    isPaymentAmountLimit({
      description:
        "The transaction amount exceeded the maximum supported value.",
    }),
    true,
  );
  assert.equal(
    isPaymentAmountLimit({ description: "Payment limit exceeded." }),
    false,
  );
  assert.equal(
    isPaymentAmountLimit({ description: "Amount is below the minimum limit." }),
    false,
  );
});

test("does not classify OTP, retry, request or rate limits as amount limits", () => {
  for (const description of [
    "Maximum OTP attempts exceeded.",
    "Retry limit exceeded.",
    "Rate limit exceeded.",
    "The amount of requests exceeds the maximum limit.",
    "The amount of retries exceeded the maximum allowed.",
  ]) {
    assert.equal(isPaymentAmountLimit({ description }), false, description);
    assert.equal(paymentErrorMessage({ description }), description);
  }
});

test("preserves useful generic errors and bounds unknown messages", () => {
  assert.equal(
    paymentErrorMessage(new Error("Failed to fetch")),
    "Failed to fetch",
  );
  assert.equal(
    paymentErrorMessage({ description: "  Connection lost.  " }),
    "Connection lost.",
  );
  assert.equal(
    paymentErrorMessage({ description: {}, message: "Server unavailable." }),
    "Server unavailable.",
  );
  assert.equal(
    paymentErrorMessage({ description: "x".repeat(500) }).length,
    300,
  );
  for (const error of [
    null,
    undefined,
    {},
    { description: "  " },
    { message: 123 },
  ]) {
    assert.equal(
      paymentErrorMessage(error),
      "Unable to process your payment. Please try again.",
    );
  }
});
