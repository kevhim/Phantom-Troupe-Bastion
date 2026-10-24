/**
 * hardwareBridge.ts
 * 
 * Abstraction layer between the frontend and hardware peripherals.
 * Supports two modes:
 *   1. SIMULATED_FIXTURES — Returns deterministic mock data for development on Laptop D
 *   2. LIVE_HARDWARE_LAN — Proxies requests to Laptop A's API (http://<laptop-a-ip>:8000)
 *      and the local Anvil RPC (http://<laptop-a-ip>:8545)
 * 
 * IMPORTANT (per AGENTS.md): This module NEVER implements host-side ESP32 transaction signing.
 * All real signing happens on-device (Laptop B's ESP32). This bridge only reads telemetry
 * and dispatches intents to the backend API for queue routing.
 */

export type BridgeMode = 'SIMULATED_FIXTURES' | 'LIVE_HARDWARE_LAN';

export interface BridgeConfig {
  mode: BridgeMode;
  apiBaseUrl: string;     // e.g. http://192.168.1.101:8000
  rpcUrl: string;         // e.g. http://192.168.1.101:8545
  timeoutMs: number;
}

const DEFAULT_CONFIG: BridgeConfig = {
  mode: 'SIMULATED_FIXTURES',
  apiBaseUrl: 'http://127.0.0.1:8000',
  rpcUrl: 'http://127.0.0.1:8545',
  timeoutMs: 5000,
};

let currentConfig: BridgeConfig = { ...DEFAULT_CONFIG };

// ─── Configuration ───────────────────────────────────────────────────
export function configureBridge(overrides: Partial<BridgeConfig>): void {
  currentConfig = { ...currentConfig, ...overrides };
}

export function getBridgeConfig(): Readonly<BridgeConfig> {
  return { ...currentConfig };
}

export function isSimulated(): boolean {
  return currentConfig.mode === 'SIMULATED_FIXTURES';
}

// ─── Simulated Fixtures ─────────────────────────────────────────────
const SIMULATED_PING: Record<string, number> = {
  'esp32-signer': 4,
  'esp32-operator': 6,
  'uno-q': 14,
  'uno-sensors': 18,
  'esp8266-alarm': 22,
};

// ─── Bridge API ──────────────────────────────────────────────────────

/** Ping a hardware device, returns latency in ms */
export async function pingDevice(deviceId: string): Promise<number> {
  if (isSimulated()) {
    await simulatedDelay(50);
    return (SIMULATED_PING[deviceId] ?? 10) + Math.floor(Math.random() * 5);
  }

  const start = performance.now();
  const res = await fetchWithTimeout(`${currentConfig.apiBaseUrl}/api/v1/hardware/${deviceId}/ping`);
  if (!res.ok) throw new Error(`Ping failed for ${deviceId}: ${res.status}`);
  return Math.round(performance.now() - start);
}

/** Fetch current RPC block number */
export async function getBlockNumber(): Promise<number> {
  if (isSimulated()) {
    await simulatedDelay(30);
    return 48940 + Math.floor(Math.random() * 10);
  }

  const res = await fetchWithTimeout(currentConfig.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
  });
  const data = await res.json();
  return parseInt(data.result, 16);
}

/** Fetch sensor telemetry from UNO gateway */
export async function getSensorTelemetry(): Promise<{
  pirMotion: boolean;
  opticalFace: boolean;
  temperatureC: number;
  humidityPct: number;
}> {
  if (isSimulated()) {
    await simulatedDelay(40);
    return {
      pirMotion: true,
      opticalFace: true,
      temperatureC: 22.4 + (Math.random() * 2 - 1),
      humidityPct: 46.2 + (Math.random() * 3 - 1.5),
    };
  }

  const res = await fetchWithTimeout(`${currentConfig.apiBaseUrl}/api/v1/telemetry/sensors`);
  return res.json();
}

/** Test connectivity to the API backend */
export async function testApiConnection(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    if (isSimulated()) {
      await simulatedDelay(120);
      return { ok: true, latencyMs: 12 };
    }
    const res = await fetchWithTimeout(`${currentConfig.apiBaseUrl}/health`);
    return { ok: res.ok, latencyMs: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, latencyMs: Math.round(performance.now() - start) };
  }
}

/** Test connectivity to the RPC node */
export async function testRpcConnection(): Promise<{ ok: boolean; latencyMs: number; blockNumber?: number }> {
  const start = performance.now();
  try {
    if (isSimulated()) {
      await simulatedDelay(80);
      return { ok: true, latencyMs: 8, blockNumber: 48940 };
    }
    const blockNumber = await getBlockNumber();
    return { ok: true, latencyMs: Math.round(performance.now() - start), blockNumber };
  } catch {
    return { ok: false, latencyMs: Math.round(performance.now() - start) };
  }
}

// ─── Utilities ───────────────────────────────────────────────────────
function simulatedDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), currentConfig.timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}
