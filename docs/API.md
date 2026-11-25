# x402-contract-scan — API reference

Paid, pay-per-request EVM contract risk scan. No account, no API key, no KYC.
Payment settles in USDC on Base directly to `0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770`.

## Endpoints

### GET /v1/preview?address=0x...  (FREE)
Returns a lightweight risk score and verdict only. Useful for agents that want a
cheap pre-check before paying for the full report.

```
$ curl -s "$BASE/v1/preview?address=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
{"address":"0x8335...2913","riskScore":<0-100>,"verdict":"low|medium|high","preview":true}
```

### GET /v1/scan?address=0x...  (PAID — 0.01 USDC on Base)
Unpaid requests return HTTP 402 with an `accepts` array:

```json
{"x402Version":1,"accepts":[{"scheme":"exact","network":"base",
  "asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "maxAmountRequired":"10000","payTo":"0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770"}]}
```

`maxAmountRequired` is in USDC base units (6 decimals): `10000` = 0.01 USDC.
Any x402-compatible client (e.g. `x402-fetch`, Coinbase AgentKit, x402 MCP servers)
can pay and retry automatically; the paid response returns the full contract report
(bytecode flags, proxy/upgradeability signals, risky selectors, ownership surface).

## Client example

```js
import { withPaymentInterceptor } from 'x402-fetch';
import { privateKeyToAccount } from 'viem/accounts';
const fetch402 = withPaymentInterceptor(fetch, privateKeyToAccount(process.env.PK));
const r = await fetch402(`${BASE}/v1/scan?address=0x...`);
console.log(await r.json());
```

## Notes

- Network: Base mainnet (chainId 8453). Asset: native USDC.
- The public hostname is served through a tunnel and may rotate; the `payTo`
  address and the 402 contract above are stable.
- Source of truth for pricing is always the live 402 response, not this document.
