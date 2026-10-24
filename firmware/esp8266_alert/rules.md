# Local rules — `firmware/esp8266_alert` (ARCHIVED in BASTION X v2.3)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first.

**Directory scope & Status:**
- **ARCHIVED (v2.3):** The ESP8266 is NO LONGER a required or active hardware dependency.
- In BASTION X v2.3, the 5V active buzzer was reassigned to **Arduino Uno #1 (Digital Pin D8)** on Laptop B (Intel Core Ultra 7 155H), controlled directly by the Supervisor Service.
- This directory is retained for archival, testing, and historical reference only.
- Services and deployment scripts MUST NEVER block or fail due to a missing ESP8266.
