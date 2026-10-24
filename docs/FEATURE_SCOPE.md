# V2 Scope / Acceptance Decisions

## P0 — official W3-02 mandatory
- Genuine 4337 smart account, delegated agent key, six spend policy dimensions, owner exception, chain/nonce safety, bypass-of-agent test.
## P1 — headline differentiators
- ESP32-held limited secp256k1 key, direct RFID/buttons/OLED review, device EIP712 exact-operation signature, role tiers with on-chain caps, **one-off owner co-sign for all out-of-policy payments** in strict W3-02 mode, direct panic revocation with truthful status.
## P2 — valuable but not essential
- ESP32#2 + OLED#2 status on A, UNO Q edge status, Uno PIR/DHT/LCD, remote ESP8266 alarm, optical challenge, incident-audit report and physically separate supervisor page.
## P3 — stretch
- Mirage synthetic deception, third-laptop hosted independent chain, camera tamper classifier, optional servo, secure-boot hardening (after device recovery planning), on-chain evidence root anchoring.

## Mandatory caveats
Direct OLED not unhackable; UID not strong MFA; UNO Q working but not HSM; ESP32 signer is not guaranteed to be unclonable; Wi-Fi is not independent connectivity; no raw personal data on blockchain; local stop != on-chain freeze; simulated decoy != financial protection.
