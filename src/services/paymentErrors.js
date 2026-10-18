const fallbackMessage = "Unable to process your payment. Please try again.";

function errorDetails(error) {
  const details =
    error?.error && typeof error.error === "object" ? error.error : error;
  const description = [details?.description, details?.message, details].find(
    (value) => typeof value === "string" && value.trim(),
  );

  return {
    code: typeof details?.code === "string" ? details.code.toLowerCase() : "",
    reason:
      typeof details?.reason === "string" ? details.reason.toLowerCase() : "",
    description: description ? description.trim().slice(0, 300) : "",
  };
}

function isAmountLimit({ code, reason, description }) {
  if (
    code === "payment_amount_limit" ||
    reason === "emi_greater_than_max_amount"
  ) {
    return true;
  }

  // A payment can also fail because of OTP attempts, request rates or retries.
  // Those limits should retain their original explanation.
  if (
    /\b(?:otp|retry|retries|attempts?|rate|requests?)\b/i.test(
      `${reason} ${description}`.replaceAll("_", " "),
    )
  ) {
    return false;
  }

  return (
    /^amount exceeds maximum amount allowed\.?$/i.test(description) ||
    (/\bamount\b/i.test(description) &&
      /\bexceed(?:s|ed|ing)?\b/i.test(description) &&
      /\b(?:maximum|max|limit)\b/i.test(description))
  );
}

export function isPaymentAmountLimit(error) {
  return isAmountLimit(errorDetails(error));
}

export function paymentErrorMessage(error, amountPaise) {
  const details = errorDetails(error);
  if (!isAmountLimit(details)) return details.description || fallbackMessage;

  const context = `${details.reason.replaceAll("_", " ")} ${details.description}`;
  if (/\bemi\b/i.test(context)) {
    return "This amount exceeds the limit for the selected EMI option. Please choose another eligible payment method.";
  }
  if (/\b(?:issuer|issuing bank|bank|card)\b/i.test(context)) {
    return "This amount exceeds a limit for the selected payment method or bank. Please choose another eligible payment method or contact your bank.";
  }

  const amount =
    Number.isSafeInteger(amountPaise) && amountPaise > 0
      ? ` (${new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amountPaise / 100)})`
      : "";

  return `This order total${amount} exceeds a payment limit allowed by Razorpay. Please contact the store for help.`;
}
