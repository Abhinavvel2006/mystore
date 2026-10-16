# Razorpay checkout

Start the API with `npm --prefix Backend start` and the storefront with `npm run dev`
from the repository root. The API always loads `Backend/.env`, including when
started from the root. Restart the backend after changing its environment.

If your terminal is already inside `Backend`, run `npm start` (or
`node server.js`) instead. `npm --prefix Backend start` is only for the project
root; running it inside `Backend` incorrectly looks for `Backend/Backend`.
Run only one backend at a time. If port 5000 is occupied, stop the old backend
with Ctrl+C in its terminal before restarting. Then click **Reload payment
methods** in the cart.

The existing `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are used only by the
backend. The frontend receives the public Key ID; never create a `VITE_` variable
for the secret. An optional frontend `VITE_API_URL` must include `/api`
(default: `http://localhost:5000/api`).

## Payment methods

```env
RAZORPAY_PAYMENT_METHODS=upi,card,netbanking,wallet
```

These are the defaults if the variable is absent. Optional additional values are
`emi` and `paylater`. Restart the server after editing this list. The backend sends
the selected methods to Standard Checkout's display configuration. Availability
still depends on the methods enabled/approved in your Razorpay Dashboard, the
device, and payment eligibility. Changing this list cannot activate an account
feature. UPI uses Razorpay's supported intent/QR flow; no UPI PIN, bank credentials,
or card details are handled by this app.

## Order and payment flow

- `GET /api/payments/config` returns the public key and method configuration.
- `POST /api/payments/orders` accepts `userEmail`, `deliveryAddress`, and
  `items: [{productId, qty}]`. An optional `checkoutId` makes creation retries
  reuse the same checkout. `POST /api/orders` is an alias for this protected
  pricing flow; it cannot create a paid order from client-supplied fields.
- The backend reads current product prices and available quantities, adds the
  existing 10% shipping/tax charge, rounds to paise, and creates an INR Razorpay
  order. A local order starts as `Awaiting payment` / `pending`.
- Checkout sends its signed response to `POST /api/payments/verify`, including
  the local `orderId`. The server verifies the signature against its stored
  Razorpay order ID, fetches the payment, checks amount/currency, and captures
  an authorized payment. Only a captured payment changes the local payment
  status to `paid` and fulfillment status to `Pending`.
- A failed/cancelled checkout keeps the cart. Failed verification can be retried
  using the saved payment reference without another charge. Fulfillment updates
  cannot change payment fields or advance unpaid Razorpay orders.
- Orders record payment method, Razorpay order/payment IDs and paid timestamp.
  Captured payments decrement each product's quantity and create one receipt
  in the existing `Revenue` collection. Revenue uses the captured order total
  (including the current 10% shipping/tax charge); gateway fees and refunds are
  not deducted automatically. Existing manual revenue and expense entries are preserved.
- Stock deductions use an atomic per-product order marker. Revenue uses the
  order ID as its unique document ID. Repeated callbacks, webhooks and restarts
  cannot apply either effect twice. Failed/pending payments do neither.
- On startup and every 30 seconds, the backend retries missing inventory/revenue
  updates for already-paid Razorpay orders. This also repairs older paid orders
  created before these updates were added. Reopening a paid checkout retries too.
- Stock is checked before checkout and deducted after capture. If another
  purchase exhausts stock in between, payment and revenue remain recorded, stock
  never goes negative, and the order shows **Stock needs attention**. Fulfillment
  stays blocked until restocking allows reconciliation to finish. Multi-product
  updates can be partially completed and then safely resumed on standalone MongoDB.
- Admin Products and Expenses & revenue refresh when you return to their tab,
  and each has a manual Refresh button. Product editing cannot change the
  internal stock-deduction markers.

## Webhook recovery

For deployed checkout, configure a Razorpay Dashboard webhook with your public
HTTPS URL `https://YOUR_BACKEND/api/payments/webhook`, select `payment.captured`
and `order.paid`, and put the same separate signing secret in:

```env
RAZORPAY_WEBHOOK_SECRET=your_separate_webhook_secret
```

The webhook validates the raw request signature and confirms the payment with
Razorpay. It recovers captured payments when the customer closes the tab before
verification. Repeated callbacks/webhooks preserve already updated fulfillment
statuses. Without the webhook, confirmation depends on the browser callback and
its saved verification retry. A localhost URL is not reachable by Razorpay.

## Verification

Run `npm --prefix Backend test` and `npm run build`. Backend tests use isolated
fake products, order storage and Razorpay responses; they never charge a card.
Use matching Razorpay **test** keys for a manual checkout test before switching
to live keys. Test success, cancellation, declined payment, verification retry,
and webhook replay. Confirm the order becomes paid only after capture.

The existing app uses browser profile storage rather than authenticated server
sessions and exposes admin/product/order APIs without authorization. Before
public live deployment, add server authentication and admin/customer ownership
checks to those existing routes. The checkout email is not proof of identity.

References: [Standard Checkout integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/),
[payment method configuration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/configure-payment-methods/),
[webhook validation](https://razorpay.com/docs/webhooks/validate-test/).
