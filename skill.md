# x402 Contract Scan

Paid, agent-native on-chain contract risk scan. No account, no API key, no KYC — pay per request in USDC on Base via HTTP 402.

## Endpoints
- `GET /v1/scan/free?address=0x...` — free truncated preview (HTTP 200)
- `GET /v1/scan?address=0x...` — full report (HTTP 402, 0.01 USDC on Base)

## Payment
- network: base
- asset: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (USDC)
- payTo: 0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770
- maxAmountRequired: 10000 (0.01 USDC)
- scheme: exact (x402)

## Discovery
- `/.well-known/x402.json` — machine-readable manifest
- `/openapi.json` — OpenAPI 3 document

## Example
```
curl -i "https://lows-immigration-expensive-friend.trycloudflare.com/v1/scan?address=0x4200000000000000000000000000000000000006"
# 402 -> read accepts[0], sign exact-scheme USDC transfer, retry with X-PAYMENT header
```
