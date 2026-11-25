---
name: x402-contract-scan
description: Check EVM token/contract risk before interacting. Paid per call in USDC on Base via x402 (0.01 USDC). No API key.
version: 1.0.0
---

# x402-contract-scan

Use when you need a quick risk read on an EVM contract/token address before swapping, approving, or paying it.

## Call

1. `GET https://tim-scsi-treated-quite.trycloudflare.com/v1/scan?address=0x<addr>`
2. Receive HTTP 402 with `accepts[]` describing the exact USDC-on-Base payment.
3. Pay 0.01 USDC to `0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770` and replay with the x402 payment header.
4. Receive JSON risk report.

## Notes
- Network: Base mainnet. Asset: USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.
- No signup, no KYC, no API key.
- Endpoint URL is ephemeral; resolve the current one from this repo's README.
