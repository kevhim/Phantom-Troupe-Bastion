# Emergency Freeze, Network Failure and Mirage Scope

## Separate control actions
1. `PANIC_LOCAL`: ESP32 GPIO panic observed -> cancel pending signing, latch no-new-signatures until authorized recovery; can request ESP8266 alert. Immediate device-local effect.
2. `APP_STOPPED`: A API halts initiating new userOps if reachable; attacker can bypass this with stolen key.
3. `REVOKE_SIGNED`: ESP32 revocation-only key signs on-chain `revokeSession` transaction; never carries transfer authority. Token gas/account funding provisioned in advance.
4. `REVOKE_SUBMITTED`: independent direct RPC accepted/relayed, but not yet final.
5. `REVOKE_CONFIRMED`: smart account state updated on chain; subsequent unauthorized delegated operations fail.
6. `REVOKE_UNAVAILABLE`/`REVOKE_FAILED`: display explicitly on supervisor status; local lock does not guarantee blockchain safety.

## Network truth table
| Fault | ESP32 direct RPC to Anvil on A | Better independent option |
|---|---|---|
| `services/api` on A killed but RPC still alive | Can submit revocation directly | Yes; this genuinely bypasses compromised app API |
| A Wi-Fi app client disconnected but A RPC still reachable from B | May work depending network reachability | Confirm with direct ESP32 ping/RPC check |
| A powered down or A RPC stopped | **Cannot** reach A-local chain | Move local chain/RPC to laptop C or use separate reachable testchain endpoint |
| Whole local Wi-Fi disconnected | **Cannot** use ESP32 built-in Wi-Fi | Requires other working network hardware/provider, **not owned**; cannot claim independent connectivity |
| Pending competing UserOp already in a block | Revoke may not preempt it | Short sessions/minimal caps; show ordering limitations |

## Demo freeze test
Create mock session key -> keep normal agent operations running -> simulate host-A API compromise while leaving RPC alive -> press directly wired panic -> ESP32 signs/relays revocation -> receipt confirms -> attempt same key via separate client/bundler; it fails. Show `PANIC_LOCAL` and `REVOKE_CONFIRMED` timestamps separately. If A-hosted RPC also killed, show truthful `REVOKE_UNAVAILABLE` and exercise fallback chain hosting on C if configured.

## Mirage (stretch, off by default)
- Trigger only in an isolated **synthetic application dataset** under `/lab/decoy` and explicit redacted test accounts.
- Contract RPC and real wallet tokens are not rewritten. Decoy's fictitious assets cannot be mistaken for chain balances; judge-facing supervisor shows `SIMULATED/DECOY` continuously.
- Attacker-facing lab may mimic a normal app for a **consenting roleplay demonstration**, but must not intentionally misrepresent real customer records, handle production credentials, or permit real transfers.
- On panic send discreet supervisor event; ESP8266 buzzer only if in a physically separate place where it is appropriate, not a guarantee of concealment.
- Never use deception as a replacement for on-chain wallet policy or emergency revoke.
