# Deployment / Service Topology V2

A: React dev server, FastAPI API, local SQLite, scripted agent, optional OpenCV/MediaPipe, Anvil and bundler on isolated lab network.  
B: hardware firmware tools, ESP32 direct reviewer/signer, UNO Q Linux health process, Uno#1 serial gateway, ESP8266 wireless alert, owner signing workstation.  
C: optional independent chain/RPC; otherwise unplugged backup.

No permanent direct signing endpoint hosted on A. Peer-specific LAN configuration/host firewall. Correct event origins and no raw keys in `.env`; bootstrap seeded local dev accounts only with nonproduction test funds. Start order: chain and EntryPoint -> bundler -> deploy -> accounts funded -> B signer tests -> B gateway -> A agent/API/indexer -> frontend -> end-to-end tests.

**Independent panic broadcast dependency:** if Anvil resides on A and A crashes completely, ESP32 cannot freeze chain. When showing survival of entire A loss, host the blockchain endpoint on C (or an approved external testnet) and preconfigure B ESP32 device to talk there. Anvil restart/reset wipes on-chain state unless persistence configured; avoid unannounced chain resets mid-demo.
