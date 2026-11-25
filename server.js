#!/usr/bin/env node
// x402-paid EVM contract risk scanner. Zero npm dependencies (node:http + JSON-RPC).
import http from 'node:http';

const PORT = Number(process.env.PORT || 8402);
const PAY_TO = process.env.PAY_TO || '0xd2DE5E9Db66Cd7720814dEF0f969BF2be90c1770';
const FACILITATOR = process.env.FACILITATOR || 'https://x402.org/facilitator';
const PRICE_ATOMIC = process.env.PRICE_ATOMIC || '10000'; // 0.01 USDC (6 decimals)
const NETWORK = process.env.NETWORK || 'base';
const USDC = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};
const RPC = {
  base: process.env.RPC_BASE || 'https://mainnet.base.org',
  'base-sepolia': process.env.RPC_BASE_SEPOLIA || 'https://sepolia.base.org',
};

// 4-byte selectors that materially change holder risk.
const SELECTORS = {
  '40c10f19': ['mint(address,uint256)', 'high', 'Privileged minting: supply can be inflated.'],
  'a0712d68': ['mint(uint256)', 'high', 'Privileged minting: supply can be inflated.'],
  'f9f92be4': ['blacklist(address)', 'high', 'Addresses can be blocked from transferring.'],
  '8456cb59': ['pause()', 'high', 'Transfers can be paused by an admin.'],
  '3659cfe6': ['upgradeTo(address)', 'high', 'Upgradeable logic: behaviour can change post-audit.'],
  '4f1ef286': ['upgradeToAndCall(address,bytes)', 'high', 'Upgradeable logic: behaviour can change post-audit.'],
  'f2fde38b': ['transferOwnership(address)', 'medium', 'Admin/owner powers are transferable.'],
  'cbf0b0c0': ['claimTokens(address)', 'medium', 'Arbitrary token sweep function present.'],
  '715018a6': ['renounceOwnership()', 'low', 'Ownable pattern detected.'],
  '8da5cb5b': ['owner()', 'low', 'Ownable pattern detected.'],
};
const EIP1967_IMPL = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const EIP1967_ADMIN = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';

async function rpc(network, method, params) {
  const res = await fetch(RPC[network], {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await res.json();
  if (j.error) throw new Error(j.error.message || 'rpc error');
  return j.result;
}

async function scan(network, address) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error('invalid address');
  const code = await rpc(network, 'eth_getCode', [address, 'latest']);
  const flags = [];
  const out = { address, network, isContract: code && code !== '0x', bytecodeBytes: code ? (code.length - 2) / 2 : 0, flags };
  if (!out.isContract) {
    out.verdict = 'eoa';
    out.note = 'No bytecode: this is an externally owned account, not a contract.';
    return out;
  }
  const lower = code.toLowerCase();
  if (lower.startsWith('0x363d3d373d3d3d363d73')) {
    flags.push({ severity: 'medium', id: 'eip1167-minimal-proxy', note: 'EIP-1167 minimal proxy: logic lives at a separate implementation.' });
  }
  const impl = await rpc(network, 'eth_getStorageAt', [address, EIP1967_IMPL, 'latest']);
  const admin = await rpc(network, 'eth_getStorageAt', [address, EIP1967_ADMIN, 'latest']);
  const implAddr = impl && impl !== '0x' + '0'.repeat(64) ? '0x' + impl.slice(-40) : null;
  const adminAddr = admin && admin !== '0x' + '0'.repeat(64) ? '0x' + admin.slice(-40) : null;
  if (implAddr) flags.push({ severity: 'high', id: 'eip1967-upgradeable', note: 'EIP-1967 implementation slot set: contract is upgradeable.', implementation: implAddr });
  if (adminAddr) flags.push({ severity: 'medium', id: 'eip1967-admin', note: 'EIP-1967 admin slot set: an admin can change the implementation.', admin: adminAddr });
  for (const [sel, [sig, severity, note]] of Object.entries(SELECTORS)) {
    if (lower.includes(sel)) flags.push({ severity, id: 'selector:' + sig, note });
  }
  const score = flags.reduce((s, f) => s + (f.severity === 'high' ? 3 : f.severity === 'medium' ? 2 : 1), 0);
  out.riskScore = score;
  out.verdict = score >= 6 ? 'high-risk' : score >= 3 ? 'caution' : 'low-signal';
  out.disclaimer = 'Heuristic static analysis of bytecode only. Not an audit, not financial advice.';
  return out;
}

function requirements(resource) {
  return {
    scheme: 'exact',
    network: NETWORK,
    maxAmountRequired: PRICE_ATOMIC,
    resource,
    description: 'EVM contract risk scan: proxy/upgradeability detection, privileged-selector flags, risk score.',
    mimeType: 'application/json',
    payTo: PAY_TO,
    maxTimeoutSeconds: 60,
    asset: USDC[NETWORK],
    extra: { name: 'USD Coin', version: '2' },
  };
}

async function settle(paymentHeader, reqs) {
  const body = JSON.stringify({ x402Version: 1, paymentHeader, paymentRequirements: reqs });
  const v = await fetch(FACILITATOR + '/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  const vj = await v.json().catch(() => ({}));
  if (!vj.isValid) return { ok: false, stage: 'verify', detail: vj };
  const s = await fetch(FACILITATOR + '/settle', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  const sj = await s.json().catch(() => ({}));
  if (!sj.success) return { ok: false, stage: 'settle', detail: sj };
  return { ok: true, txHash: sj.txHash || sj.transaction };
}

function send(res, status, obj, headers = {}) {
  const payload = JSON.stringify(obj, null, 2);
  res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*', ...headers });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    if (url.pathname === '/health') return send(res, 200, { ok: true, service: 'x402-contract-scan', network: NETWORK, price: PRICE_ATOMIC, asset: USDC[NETWORK], payTo: PAY_TO });
    if (url.pathname === '/') return send(res, 200, {
      service: 'x402-contract-scan',
      usage: 'GET /v1/scan?address=0x...&chain=base  (paid, x402 exact scheme, 0.01 USDC)',
      free: '/health',
      payTo: PAY_TO,
      network: NETWORK,
    });
    if (url.pathname === '/v1/preview') {
      // Free tier: risk score + verdict only, no flag detail.
      const address = url.searchParams.get('address');
      const chain = url.searchParams.get('chain') || NETWORK;
      try {
        const r = await scan(chain, address);
        return send(res, 200, {
          address: r.address,
          network: r.network,
          isContract: r.isContract,
          bytecodeBytes: r.bytecodeBytes,
          riskScore: r.riskScore ?? null,
          verdict: r.verdict,
          upsell: 'Full detail (severity flags, privileged selectors, proxy/implementation addresses) via paid GET /v1/scan — 0.01 USDC on Base, x402 exact scheme.',
        });
      } catch (e) {
        return send(res, 400, { error: e.message });
      }
    }
    if (url.pathname === '/v1/scan') {
      let address = url.searchParams.get('address');
      let chain = url.searchParams.get('chain') || NETWORK;
      if (req.method === 'POST') {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const b = JSON.parse(Buffer.concat(chunks).toString() || '{}');
        address = b.address || address;
        chain = b.chain || chain;
      }
      if (!address) return send(res, 400, { error: 'address query param required' });
      if (!RPC[chain]) return send(res, 400, { error: 'unsupported chain', supported: Object.keys(RPC) });
      const reqs = requirements('http://' + (req.headers.host || 'localhost') + '/v1/scan');
      const paymentHeader = req.headers['x-payment'];
      if (!paymentHeader) {
        return send(res, 402, { x402Version: 1, error: 'X-PAYMENT header required', accepts: [reqs] }, { 'x-payment-required': Buffer.from(JSON.stringify(reqs)).toString('base64') });
      }
      const paid = await settle(paymentHeader, reqs);
      if (!paid.ok) return send(res, 402, { x402Version: 1, error: 'payment not settled', stage: paid.stage, detail: paid.detail, accepts: [reqs] });
      const report = await scan(chain, address);
      return send(res, 200, { ...report, payment: { settled: true, txHash: paid.txHash } }, { 'x-payment-response': Buffer.from(JSON.stringify({ success: true, txHash: paid.txHash })).toString('base64') });
    }
    return send(res, 404, { error: 'not found' });
  } catch (e) {
    return send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, () => console.log('x402-contract-scan listening on :' + PORT + ' network=' + NETWORK + ' payTo=' + PAY_TO));
