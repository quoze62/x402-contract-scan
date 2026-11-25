# x402-contract-scan

Pay-per-call on-chain **contract scan** API using the [x402](https://x402.org) HTTP-402 protocol. Payment settles in **USDC on Base** directly to the provider wallet — no accounts, no API keys, no KYC.

## Live endpoint

```
GET https://powerpoint-doom-store-newsletters.trycloudflare.com/v1/scan?address=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

Status at publish time: **HTTP 402** (402 = payment required, as expected).

> The host above is a temporary Cloudflare tunnel and may rotate; the provider wallet is stable.

## Pricing

| Field | Value |
|---|---|
| Scheme | `exact` |
| Network | `base` |
| Asset | USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Price | 0.01 USDC (10000 base units) per call |
| Pay to | `0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770` |

## Usage

1. Call the endpoint without payment → receive `HTTP 402` with an `accepts` array.
2. Pay 0.01 USDC on Base to the `payTo` address and attach the signed payment in the `X-PAYMENT` header.
3. Receive the JSON contract scan (bytecode presence, size, basic metadata).

Any x402-compatible client works. See https://x402.org for the reference client.

## Free tier — try before you pay

`GET /v1/preview?address=0x…` — no payment, no sign-up. Returns contract detection, bytecode size, risk score and verdict:

```json
{"address":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","network":"base","isContract":true,"bytecodeBytes":1852,"riskScore":6,"verdict":"high-risk"}
```

Full detail (severity flags, privileged selectors, proxy/implementation addresses) via paid `GET /v1/scan` — 0.01 USDC on Base, x402 `exact` scheme, payTo `0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770`.

## Quickstart (10 lines)

Copy-paste guide to call the paid endpoint with curl: [https://gist.github.com/quoze62/589cdc60217c3d94ff97594851a421c4](https://gist.github.com/quoze62/589cdc60217c3d94ff97594851a421c4)
