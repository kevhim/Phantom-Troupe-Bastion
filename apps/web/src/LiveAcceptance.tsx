import { useEffect, useState } from 'react';
type Result = Record<string, any>;
async function api(path: string, payload?: unknown): Promise<any> {
  const response = await fetch('/api/v2' + path, payload === undefined ? undefined : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));
  return data;
}
export default function LiveAcceptance() {
  const [status, setStatus] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [queue, setQueue] = useState<Result[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [proof, setProof] = useState('');
  const [revokeHash, setRevokeHash] = useState('');
  async function refresh() {
    try {
      const [s, h, q] = await Promise.all([api('/integration/status'), api('/payments/history'), api('/approvals/queue')]);
      setStatus(s); setHistory(h); setQueue(q); setError('');
    } catch (e) { setStatus(null); setError(String(e)); }
  }
  useEffect(() => { void refresh(); }, []);
  async function action(fn: () => Promise<Result>) {
    setBusy(true); setError('');
    try { setResult(await fn()); await refresh(); } catch (e) { setError(String(e)); }
    finally { setBusy(false); }
  }
  const button = { margin: '5px', padding: '8px 14px', border: '1px solid #475569', borderRadius: 6, background: '#1e293b', color: '#fff' };
  const pre = { whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const, background: '#0f172a', padding: 12, fontSize: 12 };
  function pay(tokens: number) {
    return api('/payments/request', { recipient: status?.policy?.allowed_recipient, amount: tokens * 1000000,
      order_id: `demo-${tokens}-${Date.now()}`, prompt_context: 'Judge acceptance: test tokens only' });
  }
  return <main style={{ background: '#020617', color: '#e2e8f0', minHeight: '100vh', padding: 24, fontFamily: 'system-ui' }}>
    <h1>BASTION X - Live integration acceptance</h1>
    <p>Payments require chain 31337, EntryPoint, bundler receipts and exact token transfer logs.</p>
    <button style={button} disabled={busy} onClick={() => void refresh()}>Refresh live state</button>
    <p role="status">{status?.policy?.connected ? 'Chain policy read successfully' : 'Chain unavailable or unverified'} - Hardware: UNVERIFIED</p>
    {error && <p role="alert" style={{ color: '#fca5a5' }}>{error}</p>}
    <pre style={pre}>{JSON.stringify(status, null, 2)}</pre>
    <h2>Agent payment and exact exception</h2>
    <button style={button} disabled={busy || !status?.policy?.connected} onClick={() => void action(() => pay(20))}>Pay 20 test tokens</button>
    <button style={button} disabled={busy || !status?.policy?.connected} onClick={() => void action(() => pay(250))}>Request exact 250-token review</button>
    <p>Stolen-key and unauthorized-recipient tests must bypass this advisory API and submit to the bundler directly.</p>
    <h3>Unsigned review queue</h3><pre style={pre}>{JSON.stringify(queue, null, 2)}</pre>
    <p>Review on ESP32 and sign independently with the owner wallet on Laptop B. Paste JSON with request_id, approval_tier, device_signature_hex and owner_signature_hex. Never paste private keys.</p>
    <textarea aria-label="Independent approval signatures" rows={6} value={proof} onChange={e => setProof(e.target.value)} style={{ width: '100%', background: '#0f172a', color: '#e2e8f0' }} />
    <button style={button} disabled={busy || !proof} onClick={() => void action(() => api('/approvals/execute', JSON.parse(proof)))}>Submit signed exception via bundler</button>
    <h2>Revocation and evidence</h2>
    <p>Press the physical panic button. Enter its transaction hash to verify the SessionRevoked event and chain state.</p>
    <input aria-label="Revocation transaction hash" value={revokeHash} onChange={e => setRevokeHash(e.target.value)} style={{ width: '75%', background: '#0f172a', color: '#e2e8f0' }} />
    <button style={button} disabled={busy || !revokeHash} onClick={() => void action(() => api('/hardware/revocation/confirm', { tx_hash: revokeHash }))}>Verify revocation</button>
    <button style={button} disabled={busy} onClick={() => void action(() => api('/evidence/checkpoint', {}))}>Preserve checkpoint on Laptop B</button>
    <a href="/api/v2/evidence/export/json" target="_blank" rel="noreferrer">Open forensic JSON export</a>
    <h3>Last action result</h3><pre style={pre}>{JSON.stringify(result, null, 2)}</pre>
    <h3>Persisted payment history</h3><pre style={pre}>{JSON.stringify(history, null, 2)}</pre>
  </main>;
}
