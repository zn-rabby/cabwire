# Payment API v1

Base URL: `/api/v1/payment`

## 🔐 Auth

Roles: `ADMIN`, `SUPER_ADMIN`, `USER`, `DRIVER`

---

## 📊 Dashboard

- `GET /total-erning` → Total earnings _(admin)_
- `GET /total-revinue` → Total revenue _(admin)_

## 💳 Payments

- `GET /` → All payments _(admin)_
- `GET /driver` → Payments with driver _(any role)_
- `GET /:userId` → User payments _(any role)_
- `POST /:userId/withdraw` → Withdraw to Stripe _(any role)_

## 🔗 Stripe

- `GET /check-balance` → Platform balance
- `POST /create-connect-link` → Connect link _(driver)_
- `POST /create-account` → Create account _(any role)_
- `POST /transfer-to-driver` → Transfer to driver _(any role)_

---

Use proper Bearer tokens in headers. Stripe must be connected before withdrawals.
