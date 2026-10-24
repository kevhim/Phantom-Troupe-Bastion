# Local rules — `testabout` (BASTION X V2.3)

1. **Purpose:** This directory contains the complete theory, beginner-to-advanced conceptual walkthroughs, and hackathon presentation guides for BASTION X.
2. **Target Audience:** New developers, teammates, and hackathon judges seeking a clear, simple, zero-to-100 understanding of the project.
3. **Accuracy Standard:** Explanations must match the actual implemented architecture:
   - On-chain ERC-4337 smart contracts in `contracts/src/`
   - Two-laptop physical allocation (Laptop A: RTX 5060 app host; Laptop B: Intel Ultra 7 trusted root)
   - Real adversarial metrics: 100% detection rate, 0% false freeze rate, 16,384 fuzzed calls
   - Explicit security limitations (RFID UIDs are not secure standalone credentials, ESP32 is not a CC EAL6+ HSM).
4. **Packaging:** The contents of this directory are packaged into `testabout.zip` in the repository root for distribution.
