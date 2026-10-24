# Physical Architecture & Pin Assignment — V2

## Two-machine deployment: begin here
| Node | Location | Electrical/communication connection | Owns |
|---|---|---|---|
| RTX 5060 Laptop A | Main operator | Built-in/owned camera; ESP32#2 USB + OLED #2 | UI, agent, API, vision, SQLite, Anvil, 4337 bundler |
| Intel Ultra 7 Laptop B | Supervisor workstation | USB to ESP32#1 with OLED #1 and RC522/2 buttons, UNO Q, Uno#1; ESP8266 USB for power/flash; Uno#2 optional | Signer hardware, edge telemetry and peripheral gateway |
| Laptop C RTX 4060 | Unconnected backup | None | Optional independent chain/RPC, gateway or test runner |

**Important:** Earlier Bastion wired RFID to Uno#1 and both buttons to Uno#2. **V2 deliberately rewires RFID and BOTH buttons DIRECTLY to ESP32#1**, otherwise a compromised gateway computer could forge approval events. Old wiring map is historical, not the V2 signing topology.

## ESP32 #1 (3.3V signer, preferably on Laptop B for flash/power)
| Peripheral | ESP32 target pins for classic ESP32-DevKit example | Notes |
|---|---|---|
| RC522 reader | VCC 3V3; GND; SCK GPIO18; MISO GPIO19; MOSI GPIO23; SS GPIO5; RST GPIO27 | Check actual board labels/pin multiplexing. RC522 is 3.3V only. |
| OLED #1 (trusted review) | VCC 3V3; GND; SDA GPIO21; SCL GPIO22 | Use confirmed compatible 3.3V OLED. Address typically 0x3C; scan first. |
| OLED #2 | **Not connected to signer ESP32#1 in initial plan** | Assign to ESP32#2 on RTX Laptop A for independent non-security telemetry, avoiding I2C address collision. |
| Button #1 (PANIC) | GPIO32 -> normally open button -> GND | Configure INPUT_PULLUP, pressed LOW, 40–100ms debounce; cannot be overridden by host UI. |
| Button #2 (APPROVE) | GPIO33 -> normally open button -> GND | Configure INPUT_PULLUP, long-press + fresh transaction confirmation; not an ordinary reset. |
| Wi-Fi | On-board radio | Transaction-intent fetch via authenticated LAN; independently POST signed revocation to verified RPC endpoint. |
| USB | Laptop B for power/flashing/debug initially | In deployed signer firmware, disable arbitrary sign-by-serial and debug dumping private keys; secure boot/flash encryption subject to variant/recovery plan. |

### Independent display is NOT a magic trust guarantee
Display must show canonical decoded fields identical to EIP-712 sign payload: chain/network ID, wallet address (scroll full or verify fingerprint), token + decimals, amount, target/function, FULL recipient address paginated across frames, fee/asset denomination, exception role/cap, expiry, request fingerprint. Never approve using only a shortened recipient, domain name or user-chosen alias.
A 16x2 LCD on a different Uno controlled by Laptop B is **not independently trustworthy for exact signer contents**. Keep it for operational status. OLED is also not invulnerable to malicious firmware or display substitution.

## Uno #1 on Laptop B — noncritical sensor/display node
| Peripheral | Pin | Purpose |
|---|---|---|
| PIR | D2 | Motion event; not reliable occupancy proof |
| DHT11 | D4 | Temperature/humidity for node health/context, not meaningful wallet authentication |
| I2C LCD 16x2 | A4 SDA / A5 SCL | Local health status, sensor readouts; **not trusted payment confirmation** |
| SG90 optional | D6 PWM | Only if functional; need adequate safe power, no unfunded motor supply or GPIO power sourcing |
| USB serial | Intel PC B exclusive gateway owner | Event uplink; never produce `SIGNATURE_APPROVED` |

## UNO Q
Connect UNO Q USB-C to laptop B for setup/debug/power per board manual. It runs its own Linux service on compatible accessible network. The STM32 MCU can demonstrate health or local telemetry if App Lab/SDK validated. It cannot be treated as an always-working serial bridge for other Unos without an explicitly verified interface. UNO Q does not store owner financial keys.

## ESP8266 + buzzer
5V active buzzer module: **check module operating voltage and trigger requirements**. ESP8266 D1=GPIO5 used as signal where compatible, VU/5V power only if USB/module spec permits, common GND, active-low/active-high matched to module. Never connect 5V signal to 3.3V GPIO. Receive authenticated alarm messages over LAN; if compromised, buzzer can be forged/suppressed. On-board LED GPIO2 optional.

## Uno #2
Leave unused initially or implement a real independent heartbeat watchdog/diagnostic LED, attached to B only as needed. Old D3 panic/D5 approval **do not grant funds** and buttons have moved to ESP32. Do not electrically split one 5V Uno pull-up signal into an ESP32 3.3V input. No new sensors/modules/level-shifters assumed.

## ESP32 #2 — Operator telemetry on Laptop A
Connect via USB on RTX Laptop A. Wire OLED #2 to 3V3, GND, SDA GPIO21, SCL GPIO22 (verify the exact board and display). Display *untrusted* real-time agent/payment statuses and node health; it is not the payment approval screen and stores NO private signing key. Both computers therefore have actual attached IoT devices.

## Connectivity boundaries
ESP32#1 must **not use Laptop A's API as the only method to revoke on-chain**. For independent broadcast it needs its own Wi-Fi route and an RPC target that remains online. A local Anvil node hosted on A is suitable only for demo when A's chain/RPC process stays up. If A loses power/network, independent broadcast fails unless RPC/chain is hosted on C or an external reachable provider. Wire network firewall/allowlist appropriately; exposing Anvil bound to 0.0.0.0 on an untrusted network is unsafe.

## Physical and electrical safety checklist
- Label all board USB connections, COM device IDs, cables; no guessed COM5.
- Verify actual ESP32 variant and GPIO availability/strapping constraints before final flashing.
- Power 3.3V components from a suitable 3.3V supply. Never use Arduino digital pins as a power rail.
- Avoid tying multiple laptop 5V USB power supplies together; isolated breadboard sections when necessary; ground only shared circuits explicitly.
- Check current draw of OLED, RC522 and ESP32 against regulator limits. Don't drive a 5V buzzer or servo from ESP32 GPIO.
- Configure GPIO pullups/debounce, have restart/watchdog behavior, and test what happens on power loss.
- Take clear photos of **as-built** wiring and amend this document; example pin map is a proposed reference, not verified hardware measurement.
