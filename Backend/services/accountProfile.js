const editableFields = new Set([
  "name",
  "age",
  "phone",
  "location",
  "deliveryAddress",
  "paymentMethod",
]);
const paymentMethods = new Set([
  "",
  "upi",
  "card",
  "netbanking",
  "wallet",
  "emi",
  "paylater",
]);

function accountError(status, message) {
  return Object.assign(new Error(message), { status });
}

function serializeUser(user) {
  return {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    provider: user.provider || "manual",
    uid: user.uid || String(user._id),
    photoURL: user.photoURL || "",
    age: user.age ?? null,
    location: user.location || "",
    deliveryAddress: user.deliveryAddress || "",
    paymentMethod: user.paymentMethod || "",
  };
}

function readProfileInput(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => !editableFields.has(key))
  ) {
    throw accountError(
      400,
      "Only profile fields and your preferred payment method can be changed.",
    );
  }
  const fields = { ...body };
  for (const [key, max, label] of [
    ["name", 80, "Name"],
    ["location", 120, "Location"],
    ["deliveryAddress", 500, "Delivery address"],
    ["phone", 30, "Contact number"],
  ]) {
    if (fields[key] === undefined) continue;
    if (typeof fields[key] !== "string" || fields[key].trim().length > max) {
      throw accountError(
        400,
        `${label} must be text with at most ${max} characters.`,
      );
    }
    fields[key] = fields[key].trim();
  }
  if (fields.name !== undefined && !fields.name)
    throw accountError(400, "Name is required.");
  if (fields.age !== undefined) {
    if (fields.age === null || fields.age === "") fields.age = null;
    else if (
      !Number.isInteger(fields.age) ||
      fields.age < 1 ||
      fields.age > 120
    ) {
      throw accountError(400, "Age must be a whole number from 1 to 120.");
    }
  }
  if (fields.phone) {
    if (
      !/^\+?[\d\s().-]+$/.test(fields.phone) ||
      !/^\d{7,15}$/.test(fields.phone.replace(/\D/g, ""))
    ) {
      throw accountError(
        400,
        "Enter a valid contact number with 7 to 15 digits.",
      );
    }
  }
  if (
    fields.paymentMethod !== undefined &&
    !paymentMethods.has(fields.paymentMethod)
  ) {
    throw accountError(400, "Choose a supported payment method.");
  }
  return fields;
}

// Older installations have a non-sparse email index, which allows only one
// account without an email. Replace only this known index for phone accounts.
async function ensureUserIndexes(UserModel) {
  await UserModel.createCollection();
  const indexes = await UserModel.collection.indexes();
  const oldEmailIndex = indexes.find(
    (index) =>
      index.key.email === 1 &&
      Object.keys(index.key).length === 1 &&
      index.unique &&
      !index.sparse,
  );
  if (oldEmailIndex) await UserModel.collection.dropIndex(oldEmailIndex.name);
  await UserModel.collection.createIndex(
    { email: 1 },
    { unique: true, sparse: true },
  );
  await UserModel.collection.createIndex(
    { uid: 1 },
    { unique: true, sparse: true },
  );
}

module.exports = {
  accountError,
  serializeUser,
  readProfileInput,
  ensureUserIndexes,
};
