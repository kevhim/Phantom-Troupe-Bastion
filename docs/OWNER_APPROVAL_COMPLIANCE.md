# W3-02 Owner Approval Compliance Decision

**Default build: STRICT_OWNER_EXCEPTION_MODE=true.** A request exceeding the agent policy is authorized only after both (1) physical ESP32 review and its limited-device EIP-712 signature, and (2) an **independent exact-operation owner wallet EIP-712 co-signature**, cryptographically checked by BastionAccount.sol. Junior/Senior RFID chooses operator workflow/tier ceiling, not owner authorization. RFID UID alone must never approve out-of-policy spending.

**Optional future mode:** Owner can explicitly predelegate bounded exception authority to junior/senior device keys using an on-chain owner-signed policy grant. Such requests remain within the overall owner-defined delegated exception policy; *do not call them per-operation owner approved* and do not replace the strict-mode demo unless event judges approve this interpretation. Do not use this mode for recipient additions, policy expansion, high-value payouts, or account recovery.

Required test: Device signs + junior UID + physically pressed approval button **without owner co-sign** -> contract rejects. Add owner co-sign for same exact payment -> passes. Modify amount or recipient -> both signatures invalid for modified request.
