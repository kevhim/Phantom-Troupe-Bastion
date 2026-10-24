/**
 * hardwareBridge.ts
 * 
 * Abstraction layer between the Bastion X frontend and hardware peripherals.
 * Supports two modes:
 *   1. SIMULATED — Fast deterministic mock data for testing on Laptop D / offline
 *   2. LIVE_LAN — Proxies requests to Laptop A API (http://<ip>:8000) and Anvil RPC (http://<ip>:8545)
 * 
 * IMPORTANT: Per Bastion X threat model, all cryptographic private keys remain in physical hardware (ESP32).
 * Host never signs ESP32 transactions; this bridge handles telemetry and queue dispatch only.
 */

export type BridgeMode = 'SIMULATED' | 'LIVE_LAN';

export interface BridgeConfig {
  mode: BridgeMode;
  apiBaseUrl: string;
  rpcUrl: string;
  timeoutMs: number;
}

const DEFAULT_CONFIG: BridgeConfig = {
  mode: 'SIMULATED',
  apiBaseUrl: 'http://192.168.1.10:8000',
  rpcUrl: 'http://192.168.1.10:8545',
  timeoutMs: 4000,
};

let currentConfig: BridgeConfig = { ...DEFAULT_CONFIG };

export function configureBridge(overrides: Partial<BridgeConfig>): void {
  currentConfig = { ...currentConfig, ...overrides };
}

export function getBridgeConfig(): Readonly<BridgeConfig> {
  return { ...currentConfig };
}

export function isSimulated(): boolean {
  return currentConfig.mode === 'SIMULATED';
}

const SIMULATED_PING: Record<string, number> = {
  'esp32-signer': 12,
  'uno-q': 14,
  'uno-sensors': 18,
  'esp8266-alarm': 22,
};

/** Ping a hardware device, returns latency in ms */
export async function pingDevice(deviceId: string = 'esp32-signer'): Promise<number> {
  if (isSimulated()) {
    await simulatedDelay(60);
    return (SIMULATED_PING[deviceId] ?? 12) + Math.floor(Math.random() * 5);
  }

  const start = performance.now();
  try {
    const res = await fetchWithTimeout(`${currentConfig.apiBaseUrl}/api/v1/hardware/${deviceId}/ping`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Math.round(performance.now() - start);
  } catch {
    // Return high latency if failed
    return Math.round(performance.now() - start);
  }
}

/** Fetch current Anvil RPC block number */
export async function getBlockNumber(): Promise<number> {
  if (isSimulated()) {
    await simulatedDelay(40);
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

/** Fetch sensor telemetry from Uno / ESP32 node */
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
      temperatureC: 23.4 + Number(((Math.random() * 0.8) - 0.4).toFixed(1)),
      humidityPct: Math.round(44 + (Math.random() * 2 - 1)),
    };
  }

  try {
    const res = await fetchWithTimeout(`${currentConfig.apiBaseUrl}/api/v1/telemetry/sensors`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      pirMotion: true,
      opticalFace: true,
      temperatureC: 23.4,
      humidityPct: 44,
    };
  }
}

export interface OledDisplayPayload {
  title: string;
  line1?: string;
  line2?: string;
  line3?: string;
  line4?: string;
  state?: string;
  rfid?: string;
  budget?: string;
}

/** Push transaction or status text directly to physical ESP32 OLED screen */
export async function updateHardwareOledDisplay(payload: OledDisplayPayload): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`/api/v2/hardware/display-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    try {
      const res = await fetchWithTimeout(`${currentConfig.apiBaseUrl}/api/v2/hardware/display-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

/** Trigger buzzer test on hardware */
export async function testBuzzer(): Promise<boolean> {
  if (isSimulated()) {
    await simulatedDelay(80);
    return true;
  }
  try {
    const res = await fetchWithTimeout(`${currentConfig.apiBaseUrl}/api/v1/hardware/buzzer/test`, {
      method: 'POST',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Test full LAN connectivity */
export async function testLanConnection(
  customApiUrl?: string, 
  customRpcUrl?: string
): Promise<{
  apiOk: boolean;
  rpcOk: boolean;
  apiLatency: number;
  rpcLatency: number;
  blockNumber?: number;
}> {
  const targetApi = customApiUrl || currentConfig.apiBaseUrl;
  const targetRpc = customRpcUrl || currentConfig.rpcUrl;

  if (isSimulated()) {
    await simulatedDelay(150);
    return {
      apiOk: true,
      rpcOk: true,
      apiLatency: 12,
      rpcLatency: 8,
      blockNumber: 48942,
    };
  }

  let apiOk = false;
  let apiLatency = 0;
  let rpcOk = false;
  let rpcLatency = 0;
  let blockNumber: number | undefined;

  // Test API
  const apiStart = performance.now();
  try {
    const res = await fetchWithTimeout(`${targetApi}/health`);
    apiOk = res.ok;
    apiLatency = Math.round(performance.now() - apiStart);
  } catch {
    apiLatency = Math.round(performance.now() - apiStart);
  }

  // Test RPC
  const rpcStart = performance.now();
  try {
    const res = await fetchWithTimeout(targetRpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    });
    const data = await res.json();
    if (data?.result) {
      rpcOk = true;
      blockNumber = parseInt(data.result, 16);
    }
    rpcLatency = Math.round(performance.now() - rpcStart);
  } catch {
    rpcLatency = Math.round(performance.now() - rpcStart);
  }

  return { apiOk, rpcOk, apiLatency, rpcLatency, blockNumber };
}

function simulatedDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), currentConfig.timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}
