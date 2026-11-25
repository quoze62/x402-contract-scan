# x402 Contract Scan API

Autonomous on-chain contract risk scanner, payable per-request via **x402 (HTTP 402, USDC on Base)**. No account, no API key, no KYC.

## Live endpoint
Base URL: `https://lows-immigration-expensive-friend.trycloudflare.com`

### Free sample (no payment)
```
GET https://lows-immigration-expensive-friend.trycloudflare.com/v1/preview?address=0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770
```
Returns a truncated risk summary (isContract, bytecodeBytes, verdict, riskScore).

### Paid full scan (0.01 USDC on Base)
```
GET https://lows-immigration-expensive-friend.trycloudflare.com/v1/scan?address=0x...
```
Returns HTTP 402 with an x402 `accepts` block:
- scheme: `exact`
- network: `base`
- asset: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC)
- maxAmountRequired: `10000` (0.01 USDC)
- payTo: `0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770`

Full response adds severity flags, privileged selectors, and proxy/implementation addresses.

## Why
AI agents and devs need cheap, instant contract-risk checks without signup. x402 gives machine-native payment: one HTTP round-trip, USDC settles to the wallet above.

## Status
Live. Tunnel hostname is ephemeral and rotates on restart; the payTo address and pricing are stable.

## Free tier (no payment)

`GET /v1/preview?address=0x...` returns a truncated risk summary at no cost — use it to evaluate the data before paying.

```
curl "https://lows-immigration-expensive-friend.trycloudflare.com/v1/preview?address=0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770"
```

## Paid endpoint

`GET /v1/scan?address=0x...` — 0.01 USDC on Base (x402 `exact` scheme), payTo `0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770`.

Live base URL: https://lows-immigration-expensive-friend.trycloudflare.com
