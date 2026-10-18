# Customer accounts

Restart the backend with `npm start` from `Backend` after updating it. Existing
browser-only logins must sign in again once to receive a server session.

`POST /api/login` accepts `{ email, password }`. Google and phone login endpoints
(`POST /api/google-login`, `POST /api/phone-login`) accept `{ idToken }` from
Firebase's `user.getIdToken()`. All three return `{ success, user, token }`.
Registration remains separate from login.

Send `Authorization: Bearer <token>` for `GET /api/account`, `PATCH /api/account`,
and `POST /api/logout`. Account GET/PATCH return `{ success, user }`; logout
revokes the current session. Tokens are random, last 30 days, and are stored only
as SHA-256 hashes in MongoDB's `accountsessions` collection. Expiry is checked on
every request as well as cleaned up by a TTL index. Account responses are not
cached. An email in a query or request body never authorizes account access.

The public profile includes `name`, `email`, `phone`, `provider`, `uid`, `photoURL`,
`age`, `location`, `deliveryAddress`, and `paymentMethod`. PATCH permits only
`name`, `age`, `phone`, `location`, `deliveryAddress`, and `paymentMethod`.
Names must be nonblank when supplied (80 characters maximum), age is a whole
number from 1 to 120 or null/blank, contact numbers contain 7–15 digits, location
allows 120 characters, and delivery address allows 500. Optional fields can be
cleared. Payment choices are `upi`, `card`, `netbanking`, `wallet`, `emi`,
`paylater`, or an empty string to remove the preference.

Only the preferred payment method is stored. Card numbers, CVV, bank credentials,
and payment tokens are not accepted by this API. Card entry and any supported
card-saving consent stay in Razorpay Checkout.

## Firebase configuration

Set `FIREBASE_API_KEY` and `FIREBASE_PROJECT_ID` in `Backend/.env` in deployment.
These are the matching public web configuration values from your Firebase
project, not service-account credentials. During local development the backend
can read the existing `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_PROJECT_ID` from
the repository's root `.env`. Environment variables take precedence.

The server checks the token's project, issuer, expiry, subject and sign-in
provider, then calls Firebase's HTTPS `accounts:lookup` endpoint to establish
token validity and obtain the verified identity. It rejects client-supplied
identity fields, disabled users and mismatched identities. Missing configuration
or a verification-service outage returns an error instead of creating a local
login. Google/phone sign-in must also be enabled in the Firebase project.

Startup makes the user email index sparse so multiple phone-only accounts can
exist without fabricated emails. Only the previous non-sparse email index is
replaced; a unique sparse Firebase UID index is added. Account routes await these
indexes. Payment recovery runs independently of account index initialization.

Existing manual passwords retain the application's previous storage format;
this change does not migrate password hashing or protect legacy admin/order/
product endpoints. Profile responses never include password fields.

Run `npm test` from `Backend`. Account tests cover session issuance, isolation,
revocation, expiry, profile validation, response fields, Firebase verification,
and profile persistence across sign-ins using isolated storage fixtures.

References: [Firebase account lookup](https://firebase.google.com/docs/reference/rest/auth#section-get-account-info),
[Firebase ID token checks](https://firebase.google.com/docs/auth/admin/verify-id-tokens).
