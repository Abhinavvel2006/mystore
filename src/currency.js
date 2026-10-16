const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export default function formatCurrency(amount) {
  return inrFormatter.format(amount);
}
