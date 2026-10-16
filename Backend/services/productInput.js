const editableFields = new Set([
  "name",
  "price",
  "category",
  "quantity",
  "image",
]);

function readProductInput(body, { partial = false } = {}) {
  const invalid = (message) => {
    const error = new Error(message);
    error.status = 400;
    throw error;
  };
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((field) => !editableFields.has(field))
  ) {
    invalid(
      "Only product name, price, category, quantity and image can be edited.",
    );
  }
  const fields = { ...body };
  if (
    (!partial || fields.name !== undefined) &&
    (typeof fields.name !== "string" || !fields.name.trim())
  ) {
    invalid("Product name is required.");
  }
  if (typeof fields.name === "string") fields.name = fields.name.trim();
  if (
    fields.price !== undefined &&
    (!Number.isFinite(fields.price) || fields.price < 0)
  ) {
    invalid("Price must be a non-negative number.");
  }
  if (
    fields.quantity !== undefined &&
    (!Number.isSafeInteger(fields.quantity) || fields.quantity < 0)
  ) {
    invalid("Stock quantity must be a non-negative whole number.");
  }
  for (const field of ["category", "image"]) {
    if (fields[field] !== undefined && typeof fields[field] !== "string")
      invalid(`Invalid product ${field}.`);
  }
  return fields;
}

function productUpdateFilter(id, fields, expectedStock) {
  const filter = { _id: id };
  if (fields.quantity !== undefined) {
    if (
      typeof expectedStock !== "string" ||
      !/^\d+$/.test(expectedStock) ||
      !Number.isSafeInteger(Number(expectedStock))
    ) {
      const error = new Error("Reopen this product before updating its stock.");
      error.status = 428;
      throw error;
    }
    filter.quantity = Number(expectedStock);
  }
  return filter;
}

module.exports = { readProductInput, productUpdateFilter };
