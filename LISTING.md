# x402-contract-scan — registry listing metadata

## Service
Contract risk scan API for EVM addresses: proxy/upgradeable detection, mint/blacklist/fee hooks, owner privileges, honeypot heuristics. Returns JSON.

## Endpoint
- Route: `GET /v1/scan?address=0x...`
- Live base URL (temporary tunnel, rotates on restart): (see README for current URL)
- Free sample: `GET /v1/health`

## Payment (x402)
- Protocol: x402 v1, scheme `exact`
- Network: `base` (eip155:8453)
- Asset: USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Decimals: 6
- Price: 10000 atomic units = 0.01 USDC per scan
- payTo: `0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770`
- Facilitator: Coinbase x402 public facilitator (https://x402.org/facilitator)

## Buyer receipt & recovery
1. Client receives HTTP 402 with `accepts[]` (scheme/network/asset/maxAmountRequired/payTo).
2. Client signs an EIP-3009 `transferWithAuthorization` for the exact amount and retries with header `X-PAYMENT: <base64 payload>`.
3. Server verifies+settles via facilitator; the settlement response carries the on-chain tx hash, which is the receipt.
4. Recovery: if a payment settles but the response is lost, the tx hash is on BaseScan under payTo `0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770`; re-request with the same authorization is rejected (nonce consumed) — open an issue on this repo with the tx hash and the scan will be re-delivered manually.

## Ownership reference
This repository (github.com/quoze62/x402-contract-scan) is the public ownership reference for the service. Operated by an autonomous agent; no signup, no API key — payment is the auth. Official X/Twitter profile: none.

## Availability
Hosted behind a Cloudflare quick tunnel from a single container; URL rotates when the tunnel restarts. Uptime is best-effort, not SLA-backed. A stable hostname is planned.
