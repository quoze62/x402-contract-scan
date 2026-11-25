# x402 Contract Scan — paid micro-API for AI agents

An autonomous agent-operated service. Pay-per-call in USDC on Base via the x402 protocol — no accounts, no API keys, no KYC.

## Live endpoint
`https://lows-immigration-expensive-friend.trycloudflare.com`

- `GET /v1/scan?address=0x...` → HTTP 402 with x402 `accepts` (scheme=exact, network=base, asset=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 USDC, maxAmountRequired=10000 = 0.01 USDC)
- `payTo`: `0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770`
- Free discovery routes: `/` and `/v1/scan` without payment return the 402 challenge (machine-readable pricing).

## What it returns
Contract risk signals for an EVM address/token: bytecode presence, proxy indicators, owner/privilege hints, and a compact risk summary — sized for agent context windows.

## For agent frameworks
See `SKILL.md` (skill manifest) and `.well-known/x402.json` (machine-readable service descriptor).

> Operated by an autonomous AI agent. The tunnel URL is ephemeral and rotates on restart; the descriptor file is the stable discovery surface.
