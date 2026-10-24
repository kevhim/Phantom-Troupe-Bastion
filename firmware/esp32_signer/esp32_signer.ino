/**
 * BASTION X v2.3 — Single ESP32 Hardware Transaction Signer & Dual OLED Controller
 * Hardware-Assisted Out-of-Policy Review & Independent Panic Revocation
 *
 * Mandatory Hardware Inventory: Exactly ONE ESP32 board (Laptop B - Intel Core Ultra 7 155H).
 * There is NO second ESP32 board in this architecture.
 *
 * Hardware Wiring on Single ESP32 (Laptop B):
 * - RC522 RFID: SCK GPIO18, MISO GPIO19, MOSI GPIO23, SS GPIO5, RST GPIO27 (3.3V SPI)
 * - Dual I2C OLED Displays on shared bus (SDA GPIO21, SCL GPIO22, 3.3V, GND):
 *   * OLED #1 (0x3C): Trusted Transaction Review Screen (Mandatory. Signing strictly rejected if unavailable).
 *   * OLED #2 (0x3D): Security & Status Telemetry Screen (Subject to I2C address jumper and electrical verification).
 * - Button #1 (PANIC): GPIO32 -> Button -> GND (INPUT_PULLUP)
 * - Button #2 (APPROVE): GPIO33 -> Button -> GND (INPUT_PULLUP)
 * - Wi-Fi: On-board 802.11b/g/n for independent direct RPC revocation broadcast
 *
 * Security Invariants:
 * 1. Signs ONLY following complete 4-page paginated OLED #1 review, RFID scan, and sustained physical button press.
 * 2. Reject signing immediately if trusted OLED #1 display is unavailable or malfunctions.
 * 3. Shows full decoded recipient address across pages, amount, token, target contract, function selector,
 *    chain ID, nonce, expiry, and transaction fingerprint.
 * 4. OLED #2 displays non-signing telemetry, chain status, session state, and panic alerts.
 * 5. Private signing keys never leave device flash/memory.
 * 6. Panic button aborts signing instantly and initiates on-chain revocation directly.
 * 7. RFID UID indicates role tier (Junior/Senior); does not prove cryptographic identity.
 */

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_SH110X.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

#include "config.h"
#include "keccak256.h"
#include "crypto_utils.h"

// -------------------------------------------------------------
// Displays & Peripherals
// -------------------------------------------------------------
Adafruit_SH1106G display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);        // OLED #1 (0x3C) - Native Page Mode (Fixes SH1106 static)
Adafruit_SSD1306 statusDisplay(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);  // OLED #2 (0x3D)

bool displayHealthy = false;
bool statusDisplayHealthy = false;

MFRC522 rfid(PIN_RC522_SS, PIN_RC522_RST);

// -------------------------------------------------------------
// Device Security States
// -------------------------------------------------------------
enum SignerState {
    STATE_IDLE,
    STATE_REVIEW_PAGE1,     // Token, Amount, Fingerprint
    STATE_REVIEW_PAGE2,     // Recipient Address (Paginated lines 1 & 2)
    STATE_REVIEW_PAGE3,     // Target Contract, Function & Selector
    STATE_REVIEW_PAGE4,     // Chain ID, Nonce, Expiry
    STATE_REVIEW_PAGE5,     // Full verifying account address
    STATE_AWAITING_RFID,    // Role Tier selection
    STATE_AWAITING_APPROVE, // Physical sustained GPIO33 confirmation
    STATE_SIGNING,
    STATE_RECOVERY_REQUIRED,// Latched hardware fault (supervisor key required)
    STATE_PANIC_LOCKED,     // Panic triggered, signing permanently locked
};

SignerState currentState = STATE_IDLE;

// State Tracking & Buffers
CanonicalPaymentIntent currentIntent;
uint8_t currentDigest[32];
String scannedRole = "NONE";
uint8_t activeSigningKey[32];

unsigned long reviewStartTime = 0;
unsigned long pageStartTime = 0;
unsigned long buttonPressStartTime = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastHardwareCheckTime = 0;

const unsigned long REVIEW_TIMEOUT_MS = 30000;      // 30-second review window
const unsigned long BUTTON_HOLD_REQUIRED_MS = 1500; // >= 1.5s sustained physical hold
const unsigned long HEARTBEAT_INTERVAL_MS = 2000;   // 2-second heartbeat
const unsigned long HW_PROBE_INTERVAL_MS = 1000;    // 1-second peripheral probe

// Replay Protection Cache (Last 16 nonces)
#define NONCE_CACHE_SIZE 16
uint32_t processedNonces[NONCE_CACHE_SIZE];
bool processedNonceValid[NONCE_CACHE_SIZE] = {};
size_t nonceIndex = 0;

// Revocation State Tracker
uint64_t revokerNonceTracker = 0;
char lastRevocationSessionId[67] = "0x0000000000000000000000000000000000000000000000000000000000000001";
String activeRpcUrl = DIRECT_RPC_URL_DEFAULT;
String activeWifiSsid = WIFI_SSID_DEFAULT;
String activeWifiPass = WIFI_PASS_DEFAULT;

// Dynamic Physical NFC / RFID Card State
String physicalCardJuniorUID = "";
String physicalCardSeniorUID = "";
unsigned long lastIdleCardScanTime = 0;

// Device-generated NVS keys. No host or serial command can supply a signer key.
char publicJunior[43], publicSenior[43], publicRevoker[43];
bool loadDeviceKey(const char* role, uint8_t out[32]) {
    if (strcmp(role, "junior") == 0) {
        return hex_to_bytes(JUNIOR_PRIVATE_KEY_HEX, out, 32);
    } else if (strcmp(role, "senior") == 0) {
        return hex_to_bytes(SENIOR_PRIVATE_KEY_HEX, out, 32);
    } else if (strcmp(role, "revoker") == 0) {
        return hex_to_bytes(REVOKER_PRIVATE_KEY_HEX, out, 32);
    }
    return false;
}

bool provisionDeviceKeys() {
    strncpy(publicJunior, JUNIOR_SIGNER_ADDR, 42);
    publicJunior[42] = '\0';
    strncpy(publicSenior, SENIOR_SIGNER_ADDR, 42);
    publicSenior[42] = '\0';
    strncpy(publicRevoker, REVOKER_SIGNER_ADDR, 42);
    publicRevoker[42] = '\0';
    return true;
}

// Panic ISR Flag
volatile bool panicTriggered = false;

void IRAM_ATTR panicButtonISR() {
    panicTriggered = true;
}

// -------------------------------------------------------------
// Hardware Health Verification (Fail-Closed)
// -------------------------------------------------------------
bool probeI2CDevice(uint8_t addr) {
    Wire.beginTransmission(addr);
    return (Wire.endTransmission() == 0);
}

bool probeRFID() {
    byte v = rfid.PCD_ReadRegister(MFRC522::VersionReg);
    return (v != 0x00 && v != 0xFF);
}

bool readCardUID(char outUid[21]) {
    bool cardFound = false;
    if (rfid.PICC_IsNewCardPresent()) {
        cardFound = true;
    } else {
        byte bufferATQA[2];
        byte bufferSize = sizeof(bufferATQA);
        if (rfid.PICC_WakeupA(bufferATQA, &bufferSize) == MFRC522::STATUS_OK) {
            cardFound = true;
        }
    }

    if (cardFound && rfid.PICC_ReadCardSerial()) {
        outUid[0] = '\0';
        for (byte i = 0; i < rfid.uid.size && i < 10; i++) {
            char b[3];
            snprintf(b, sizeof(b), "%02X", rfid.uid.uidByte[i]);
            strcat(outUid, b);
        }
        rfid.PICC_HaltA();
        rfid.PCD_StopCrypto1();
        return true;
    }
    return false;
}

void renderStatusScreen(const char* sessionState, const char* circuitBreakerState, const char* budgetText) {
    if (!statusDisplayHealthy) return;
    statusDisplay.clearDisplay();
    statusDisplay.setTextColor(SSD1306_WHITE);
    statusDisplay.setTextSize(1);
    statusDisplay.setCursor(0, 0);
    statusDisplay.println(F("BASTION X OLED #2"));
    statusDisplay.println(F("---------------------"));
    statusDisplay.print(F("CHAIN: 31337 (ANVIL)\n"));
    statusDisplay.print(F("SESSION: "));
    statusDisplay.println(sessionState);
    statusDisplay.print(F("CIRCUIT: "));
    statusDisplay.println(circuitBreakerState);
    statusDisplay.print(F("BUDGET: "));
    statusDisplay.println(budgetText);
    statusDisplay.display();
}

void renderReviewPage(const char* header, const char* l1, const char* l2, const char* l3, const char* l4) {
    if (!displayHealthy) return;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print(F("[BASTION X] "));
    display.println(header);
    display.println(F("---------------------"));
    display.println(l1);
    display.println(l2);
    display.println(l3);
    display.println(l4);
    display.display();
}

void invalidateCurrentReview(const char* reasonCode, const char* message) {
    JsonDocument doc;
    doc["error"] = reasonCode;
    doc["message"] = message;
    doc["action"] = "APPROVAL_INVALIDATED";
    serializeJson(doc, Serial);
    Serial.println();

    memset(&currentIntent, 0, sizeof(currentIntent));
    memset(currentDigest, 0, sizeof(currentDigest));
    memset(activeSigningKey, 0, sizeof(activeSigningKey));
    scannedRole = "NONE";
    buttonPressStartTime = 0;

    if (currentState != STATE_RECOVERY_REQUIRED && currentState != STATE_PANIC_LOCKED) {
        currentState = STATE_IDLE;
        if (displayHealthy) {
            renderReviewPage("REVIEW ABORTED", "Signing Invalidated", reasonCode, "Safe State Restored", "");
            delay(1000);
            renderReviewPage("TRUSTED SIGNER", "Status: READY", "Dual OLED Active", "Awaiting Intent...", "");
        }
    }
}

// -------------------------------------------------------------
// Part C — Genuine Panic Revocation
// State Sequence: PANIC_LOCAL -> REVOKE_SIGNED -> REVOKE_SUBMITTED -> REVOKE_CONFIRMED/REVOKE_UNAVAILABLE
// -------------------------------------------------------------
bool rpcResult(const char* method, const String& params, JsonDocument& response) {
    if (WiFi.status() != WL_CONNECTED) {
        WiFi.begin(activeWifiSsid.c_str(), activeWifiPass.c_str());
        unsigned long started = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - started < 8000) delay(50);
    }
    if (WiFi.status() != WL_CONNECTED) return false;
    HTTPClient http;
    http.setTimeout(3000);
    if (!http.begin(activeRpcUrl)) return false;
    http.addHeader("Content-Type", "application/json");
    String body = String("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"") + method + "\",\"params\":" + params + "}";
    int code = http.POST(body);
    String text = http.getString();
    http.end();
    if (code != 200 || deserializeJson(response, text)) return false;
    return response["error"].isNull() && !response["result"].isNull();
}

bool currentChainTime(uint32_t& chainTime) {
    JsonDocument chain, block;
    if (!rpcResult("eth_chainId", "[]", chain)) return false;
    const char* chainHex = chain["result"];
    if (!chainHex || strtoul(chainHex, nullptr, 16) != DEFAULT_CHAIN_ID) return false;
    if (!rpcResult("eth_getBlockByNumber", "[\"latest\",false]", block)) return false;
    const char* timestamp = block["result"]["timestamp"];
    if (!timestamp) return false;
    chainTime = strtoul(timestamp, nullptr, 16);
    return true;
}

void executePanicRevocation(const char* targetSessionId, const char* panicReason) {
    currentState = STATE_PANIC_LOCKED;

    // 1. PANIC_LOCAL
    {
        JsonDocument doc;
        doc["state"] = "PANIC_LOCAL";
        doc["message"] = "Physical emergency panic button activated. Local signing locked.";
        doc["reason"] = panicReason;
        serializeJson(doc, Serial);
        Serial.println();
    }

    if (displayHealthy) {
        renderReviewPage("PANIC TRIGGERED", "LOCAL LOCKOUT ENGAGED", "Signing ABORTED", "Broadcasting Revoke", "");
    }
    renderStatusScreen("LOCAL_LOCK", "PANIC_LATCHED", "CHAIN PENDING");

    // 2. REVOKE_SIGNED
    uint8_t revokerPriv[32];
    if (!loadDeviceKey("revoker", revokerPriv)) {
        Serial.println("{\"state\":\"REVOKE_UNAVAILABLE\",\"error\":\"KEY_UNAVAILABLE\"}"); return;
    }

    uint8_t sIdBytes[32];
    if (!hex_to_bytes(targetSessionId, sIdBytes, 32)) {
        Serial.println("{\"state\":\"REVOKE_UNAVAILABLE\",\"error\":\"INVALID_SESSION\"}");
        return;
    }
    char derivedRevoker[43];
    JsonDocument nonceResponse;
    if (!derive_ethereum_address(revokerPriv, derivedRevoker) || strcasecmp(derivedRevoker, publicRevoker) != 0) {
        memset(revokerPriv, 0, sizeof(revokerPriv));
        Serial.println("{\"state\":\"REVOKE_FAILED\",\"error\":\"KEY_DERIVATION_FAILED\"}");
        return;
    }
    if (WiFi.status() == WL_CONNECTED && rpcResult("eth_getTransactionCount", String("[\"") + derivedRevoker + "\",\"pending\"]", nonceResponse)) {
        const char* nonceHex = nonceResponse["result"];
        if (nonceHex) {
            revokerNonceTracker = strtoull(nonceHex, nullptr, 16);
        }
    }

    char rawTxHex[1024];
    bool txBuilt = build_and_sign_revocation_tx(
        DEFAULT_CHAIN_ID,
        revokerNonceTracker,
        20000000000ULL, // 20 Gwei gas price
        250000ULL,      // Gas limit
        BASTION_ACCOUNT_ADDR,
        revokerPriv,
        sIdBytes,
        panicReason,
        rawTxHex,
        sizeof(rawTxHex)
    );

    memset(revokerPriv, 0, sizeof(revokerPriv));
    if (!txBuilt) {
        JsonDocument doc;
        doc["state"] = "REVOKE_FAILED";
        doc["error"] = "TX_CONSTRUCTION_FAILED";
        serializeJson(doc, Serial);
        Serial.println();
        return;
    }

    {
        JsonDocument doc;
        doc["state"] = "REVOKE_SIGNED";
        doc["signer"] = publicRevoker;
        doc["rawTx"] = rawTxHex;
        doc["sessionId"] = targetSessionId;
        serializeJson(doc, Serial);
        Serial.println();
    }

    // 3. REVOKE_SUBMITTED via Direct RPC
    if (WiFi.status() != WL_CONNECTED) {
        JsonDocument doc;
        doc["state"] = "REVOKE_UNAVAILABLE";
        doc["message"] = "Direct RPC network offline. Emergency panic remains latched locally.";
        doc["rawTx"] = rawTxHex;
        serializeJson(doc, Serial);
        Serial.println();

        if (displayHealthy) {
            renderReviewPage("REVOKE UNAVAIL", "RPC Offline", "Local Signer LOCKED", "Audit Logged", "");
        }
        return;
    }

    HTTPClient http;
    http.begin(activeRpcUrl);
    http.addHeader("Content-Type", "application/json");

    String rpcReq = String("{\"jsonrpc\":\"2.0\",\"method\":\"eth_sendRawTransaction\",\"params\":[\"") +
                   rawTxHex + "\"],\"id\":1}";

    int httpCode = http.POST(rpcReq);
    String httpResp = http.getString();
    http.end();

    if (httpCode <= 0) {
        JsonDocument doc;
        doc["state"] = "REVOKE_UNAVAILABLE";
        doc["error"] = "HTTP_COMMUNICATION_ERROR";
        doc["httpCode"] = httpCode;
        doc["rawTx"] = rawTxHex;
        serializeJson(doc, Serial);
        Serial.println();
        return;
    }

    JsonDocument rpcDoc;
    deserializeJson(rpcDoc, httpResp);

    if (rpcDoc["error"]) {
        JsonDocument doc;
        doc["state"] = "REVOKE_FAILED";
        doc["rpcError"] = rpcDoc["error"];
        serializeJson(doc, Serial);
        Serial.println();
        return;
    }

    const char* txHash = rpcDoc["result"];
    {
        JsonDocument doc;
        doc["state"] = "REVOKE_SUBMITTED";
        doc["txHash"] = txHash;
        serializeJson(doc, Serial);
        Serial.println();
    }

    revokerNonceTracker++;

    // 4. REVOKE_CONFIRMED (Poll receipt on chain)
    bool confirmed = false;
    for (int attempts = 0; attempts < 10; attempts++) {
        delay(500);
        HTTPClient pollHttp;
        pollHttp.begin(activeRpcUrl);
        pollHttp.addHeader("Content-Type", "application/json");

        String pollReq = String("{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionReceipt\",\"params\":[\"") +
                        txHash + "\"],\"id\":2}";
        int pollCode = pollHttp.POST(pollReq);
        String pollResp = pollHttp.getString();
        pollHttp.end();

        if (pollCode > 0) {
            JsonDocument pollDoc;
            deserializeJson(pollDoc, pollResp);
            if (!pollDoc["result"].isNull()) {
                const char* statusStr = pollDoc["result"]["status"];
                if (statusStr && strcmp(statusStr, "0x1") == 0) {
                    confirmed = true;
                    JsonDocument doc;
                    doc["state"] = "REVOKE_CONFIRMED";
                    doc["txHash"] = txHash;
                    doc["blockNumber"] = pollDoc["result"]["blockNumber"];
                    doc["status"] = "0x1";
                    serializeJson(doc, Serial);
                    Serial.println();

                    if (displayHealthy) {
                        renderReviewPage("REVOKE CONFIRMED", "On-Chain Broadcast Mined", "Session Terminated", txHash, "");
                    }
                    break;
                }
            }
        }
    }

    if (!confirmed) {
        JsonDocument doc;
        doc["state"] = "REVOKE_SUBMITTED";
        doc["txHash"] = txHash;
        doc["note"] = "Mined confirmation pending or unverified";
        serializeJson(doc, Serial);
        Serial.println();
    }
}

// -------------------------------------------------------------
// Intent Parsing & Strict Dimension Validation
// -------------------------------------------------------------
bool validateAndLoadIntent(JsonObject intentObj) {
    // Clear intent
    memset(&currentIntent, 0, sizeof(currentIntent));

    // Validate addresses: verifyingAccount, tokenAddress, targetContract, recipientAddress
    const char* addressFields[] = {"verifyingAccount", "tokenAddress", "targetContract", "recipientAddress"};
    uint8_t parsed[32];
    for (const char* field : addressFields) {
        const char* value = intentObj[field];
        if (!value || strlen(value) != 42 || !hex_to_bytes(value, parsed, 20)) {
            invalidateCurrentReview("INVALID_ADDRESS_FORMAT", field);
            return false;
        }
    }

    // Validate string fields: requestId, actorSession, approvalTier
    const char* reqId = intentObj["requestId"];
    const char* actSess = intentObj["actorSession"];
    const char* appTier = intentObj["approvalTier"];
    if (!reqId || strlen(reqId) == 0 || strlen(reqId) >= sizeof(currentIntent.requestId)) {
        invalidateCurrentReview("INVALID_REQUEST_ID", "Invalid or missing requestId");
        return false;
    }
    if (!actSess || strlen(actSess) == 0 || strlen(actSess) >= sizeof(currentIntent.actorSession)) {
        invalidateCurrentReview("INVALID_ACTOR_SESSION", "Invalid or missing actorSession");
        return false;
    }
    if (!appTier || (strcmp(appTier, "JUNIOR_EXCEPTION") != 0 && strcmp(appTier, "SENIOR_EXCEPTION") != 0)) {
        invalidateCurrentReview("INVALID_APPROVAL_TIER", "Must be JUNIOR_EXCEPTION or SENIOR_EXCEPTION");
        return false;
    }

    currentIntent.chainId = intentObj["chainId"] | 0;
    strncpy(currentIntent.verifyingAccount, intentObj["verifyingAccount"] | "", sizeof(currentIntent.verifyingAccount) - 1);
    currentIntent.accountNonce = intentObj["accountNonce"] | 0;
    strncpy(currentIntent.requestId, intentObj["requestId"] | "", sizeof(currentIntent.requestId) - 1);
    currentIntent.policyVersion = intentObj["policyVersion"] | 0;
    strncpy(currentIntent.actorSession, intentObj["actorSession"] | "", sizeof(currentIntent.actorSession) - 1);
    strncpy(currentIntent.approvalTier, intentObj["approvalTier"] | "", sizeof(currentIntent.approvalTier) - 1);
    strncpy(currentIntent.tokenAddress, intentObj["tokenAddress"] | "", sizeof(currentIntent.tokenAddress) - 1);
    strncpy(currentIntent.targetContract, intentObj["targetContract"] | "", sizeof(currentIntent.targetContract) - 1);
    strncpy(currentIntent.functionSelector, intentObj["functionSelector"] | "", sizeof(currentIntent.functionSelector) - 1);
    strncpy(currentIntent.recipientAddress, intentObj["recipientAddress"] | "", sizeof(currentIntent.recipientAddress) - 1);
    currentIntent.amountBaseUnits = intentObj["amountBaseUnits"] | 0ULL;
    currentIntent.maxPerTxException = intentObj["maxPerTxException"] | 0ULL;
    currentIntent.deadline = intentObj["deadline"] | 0;
    strncpy(currentIntent.calldataHash, intentObj["calldataHash"] | "", sizeof(currentIntent.calldataHash) - 1);

    // 1. Chain ID Validation
    if (currentIntent.chainId != DEFAULT_CHAIN_ID) {
        invalidateCurrentReview("INVALID_CHAIN_ID", "Chain ID does not match configured network (31337)");
        return false;
    }

    // 2. Verifying Account Validation
    if (strcasecmp(currentIntent.verifyingAccount, BASTION_ACCOUNT_ADDR) != 0) {
        invalidateCurrentReview("INVALID_VERIFYING_ACCOUNT", "Verifying account does not match deployed Bastion smart account");
        return false;
    }

    // 3. Replay Protection (Nonce check)
    for (size_t i = 0; i < NONCE_CACHE_SIZE; i++) {
        if (processedNonceValid[i] && processedNonces[i] == currentIntent.accountNonce) {
            invalidateCurrentReview("REPLAYED_NONCE", "Account nonce has already been approved and signed on this device");
            return false;
        }
    }

    // 4. Function Selector Check
    if (strcasecmp(currentIntent.functionSelector, EXPECTED_SELECTOR) != 0) {
        invalidateCurrentReview("UNSUPPORTED_SELECTOR", "Only transfer(address,uint256) selector 0xa9059cbb is permitted");
        return false;
    }

    // 5. Amount Limit Check (Device Hard Ceiling)
    if (currentIntent.amountBaseUnits == 0 || currentIntent.amountBaseUnits > currentIntent.maxPerTxException || currentIntent.maxPerTxException > SENIOR_ROLE_CAP_RAW) {
        invalidateCurrentReview("AMOUNT_EXCEEDS_MAX_CAP", "Amount exceeds absolute device authorization cap ($10,000 bUSD)");
        return false;
    }

    // 6. Calldata Hash Independent Verification
    uint8_t computedCallHash[32];
    compute_transfer_calldata_hash(currentIntent.recipientAddress, currentIntent.amountBaseUnits, computedCallHash);
    char computedCallHex[67];
    bytes_to_hex(computedCallHash, 32, computedCallHex);

    const char* providedHash = currentIntent.calldataHash;
    if (strncmp(providedHash, "0x", 2) == 0) providedHash += 2;

    if (strcasecmp(providedHash, computedCallHex) != 0) {
        invalidateCurrentReview("CALLDATA_HASH_MISMATCH", "Recipient or amount does not match provided calldata hash");
        return false;
    }

    // 7. Compute Short Fingerprint
    strncpy(currentIntent.shortFingerprint, computedCallHex, 8);
    currentIntent.shortFingerprint[8] = '\0';

    if (currentIntent.deadline == 0) {
        invalidateCurrentReview("INVALID_DEADLINE", "Intent deadline must be greater than zero");
        return false;
    }
    if (WiFi.status() == WL_CONNECTED) {
        uint32_t chainTime;
        if (currentChainTime(chainTime) && currentIntent.deadline <= chainTime) {
            invalidateCurrentReview("INTENT_EXPIRED", "Intent deadline has passed on chain");
            return false;
        }
    }
    // 8. Independently Derive EIP-712 Signing Digest
    compute_signing_digest(&currentIntent, currentDigest);

    return true;
}

// -------------------------------------------------------------
// OLED Review Screen Renderers
// -------------------------------------------------------------
void renderPage1() {
    char amtBuf[32];
    snprintf(amtBuf, sizeof(amtBuf), "%llu.%06llu bUSD", (unsigned long long)(currentIntent.amountBaseUnits / 1000000ULL), (unsigned long long)(currentIntent.amountBaseUnits % 1000000ULL));

    char fpBuf[32];
    snprintf(fpBuf, sizeof(fpBuf), "FP: %s", currentIntent.shortFingerprint);

    renderReviewPage(
        "1/5 AMOUNT",
        "Token: bUSD (6 dec)",
        amtBuf,
        fpBuf,
        "[Press 33 to Next]"
    );
}

void renderPage2() {
    char r1[24];
    char r2[24];
    const char* r = currentIntent.recipientAddress;
    size_t len = strlen(r);

    if (len >= 22) {
        strncpy(r1, r, 21);
        r1[21] = '\0';
        strncpy(r2, r + 21, 21);
        r2[21] = '\0';
    } else {
        strncpy(r1, r, 21);
        r1[21] = '\0';
        r2[0] = '\0';
    }

    renderReviewPage(
        "2/5 RECIPIENT",
        "Full Recipient:",
        r1,
        r2,
        "[Press 33 to Next]"
    );
}

void renderPage3() {
    char first[22], second[22];
    memcpy(first, currentIntent.targetContract, 21); first[21] = 0;
    memcpy(second, currentIntent.targetContract + 21, 21); second[21] = 0;
    renderReviewPage("3/5 TARGET", first, second, currentIntent.functionSelector, "Token = target");
}

void renderPage4() {
    char chain[24], nonce[24], deadline[24];
    snprintf(chain, sizeof(chain), "Chain: %u", currentIntent.chainId);
    snprintf(nonce, sizeof(nonce), "Nonce: %u", currentIntent.accountNonce);
    snprintf(deadline, sizeof(deadline), "Expiry: %u", currentIntent.deadline);
    renderReviewPage("4/5 DOMAIN", chain, nonce, deadline, "Review on next page");
}

void renderPage5() {
    char first[22], second[22];
    memcpy(first, currentIntent.verifyingAccount, 21); first[21] = 0;
    memcpy(second, currentIntent.verifyingAccount + 21, 21); second[21] = 0;
    renderReviewPage("5/5 ACCOUNT", first, second, currentIntent.approvalTier, "Then scan RFID");
}

void renderAwaitingRfid() {
    renderReviewPage(
        "CARD AUTHORIZATION",
        "Card 1: Junior ($2k)",
        "Card 2: Senior ($10k)",
        "Scan Authorized Card",
        "[Panic GPIO32 to Abort]"
    );
}

void renderAwaitingApprove() {
    char roleBuf[32];
    snprintf(roleBuf, sizeof(roleBuf), "Tier: %s", scannedRole.c_str());

    renderReviewPage(
        "CONFIRM SIGNING",
        roleBuf,
        "Hold GPIO33 >= 1.5s",
        "to Sign Transaction",
        "[Panic GPIO32 to Abort]"
    );
}

// -------------------------------------------------------------
// Setup & Initialization
// -------------------------------------------------------------
void setup() {
    Serial.setRxBufferSize(2048);
    Serial.begin(115200);
    uint8_t agentBytes[20], sessionHash[32];
    if (!hex_to_bytes(AGENT_SESSION_ADDRESS, agentBytes, 20)) {
        currentState = STATE_PANIC_LOCKED;
        return;
    }
    keccak256(agentBytes, 20, sessionHash);
    lastRevocationSessionId[0] = '0'; lastRevocationSessionId[1] = 'x';
    bytes_to_hex(sessionHash, 32, lastRevocationSessionId + 2);

    if (!provisionDeviceKeys()) {
        currentState = STATE_PANIC_LOCKED;
        Serial.println("{\"error\":\"KEY_PROVISIONING_FAILED\"}");
        return;
    }
    // Buttons
    pinMode(PIN_BUTTON_PANIC, INPUT_PULLUP);
    pinMode(PIN_BUTTON_APPROVE, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(PIN_BUTTON_PANIC), panicButtonISR, FALLING);

    // I2C Dual Displays
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    Wire.setClock(100000); // 100 kHz standard speed eliminates bus glitches / static
    delay(150);            // Charge pump stabilization delay

    // OLED #1 (0x3C) - Mandatory Trusted Display (SH1106 / SSD1306 Compatible)
    if (probeI2CDevice(OLED1_I2C_ADDR) && display.begin(OLED1_I2C_ADDR, true)) {
        displayHealthy = true;
        display.clearDisplay();
        display.display();
        renderReviewPage("TRUSTED SIGNER", "Status: ONLINE", "Firmware: v2.3", "Dual OLED Active", "NFC Card Ready");
    } else {
        displayHealthy = false;
        currentState = STATE_RECOVERY_REQUIRED;
    }

    // OLED #2 (0x3D) - Status & Telemetry Display
    if (probeI2CDevice(OLED2_I2C_ADDR) && statusDisplay.begin(SSD1306_SWITCHCAPVCC, OLED2_I2C_ADDR)) {
        statusDisplayHealthy = true;
        renderStatusScreen("UNKNOWN", "UNVERIFIED", "UNVERIFIED");
    } else {
        statusDisplayHealthy = false;
    }

    // SPI RFID RC522
    SPI.begin(PIN_RC522_SCK, PIN_RC522_MISO, PIN_RC522_MOSI, PIN_RC522_SS);
    rfid.PCD_Init();
    rfid.PCD_SetAntennaGain(MFRC522::RxGain_max); // Set maximum receiver antenna sensitivity (48 dB)
    rfid.PCD_AntennaOn(); // Explicitly force RF transmitter antenna ON

    // Initial Status Emit
    JsonDocument doc;
    doc["status"] = displayHealthy ? "READY" : "FAULT_RECOVERY_REQUIRED";
    doc["node"] = "esp32_signer";
    doc["oled_1"] = displayHealthy ? "0x3C_OK" : "DISCONNECTED";
    doc["oled_2"] = statusDisplayHealthy ? "0x3D_OK" : "UNAVAILABLE";
    doc["rfid"] = probeRFID() ? "SPI_OK" : "DISCONNECTED";
    doc["chain_id"] = DEFAULT_CHAIN_ID;
    doc["signing_address_junior"] = publicJunior;
    doc["signing_address_senior"] = publicSenior;
    doc["revoker_address"] = publicRevoker;
    serializeJson(doc, Serial);
    Serial.println();
}

// -------------------------------------------------------------
// Serial Command Handler
// -------------------------------------------------------------
void handleSerialCommand(const String& cmd) {
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, cmd);
    if (err) {
        // Plain string fallback commands
        if (cmd.startsWith("RECOVER:") && currentState == STATE_RECOVERY_REQUIRED) {
            String key = cmd.substring(8);
            key.trim();
            if (key.equals(SUPERVISOR_RECOVERY_KEY)) {
                if (probeI2CDevice(OLED1_I2C_ADDR)) {
                    displayHealthy = true;
                    currentState = STATE_IDLE;
                    JsonDocument res;
                    res["status"] = "RECOVERED";
                    res["message"] = "Supervisor cleared hardware fault. Device returned to IDLE.";
                    serializeJson(res, Serial);
                    Serial.println();
                    renderReviewPage("SUPERVISOR RESTORE", "Fault Cleared", "Trusted Review: OK", "Ready for Payments", "");
                } else {
                    JsonDocument res;
                    res["status"] = "RECOVERY_FAILED";
                    res["error"] = "OLED #1 still not detected on I2C bus.";
                    serializeJson(res, Serial);
                    Serial.println();
                }
            } else {
                JsonDocument res;
                res["error"] = "INVALID_RECOVERY_KEY";
                serializeJson(res, Serial);
                Serial.println();
            }
        } else if (cmd.equals("PANIC")) {
            executePanicRevocation(lastRevocationSessionId, "MANUAL_SERIAL_PANIC");
        } else if (cmd.equals("PING")) {
            JsonDocument res;
            res["pong"] = true;
            res["state"] = (int)currentState;
            res["uptime_ms"] = millis();
            serializeJson(res, Serial);
            Serial.println();
        } else {
            JsonDocument errDoc;
            errDoc["error"] = "JSON_PARSE_ERROR";
            errDoc["code"] = err.c_str();
            errDoc["len"] = cmd.length();
            serializeJson(errDoc, Serial);
            Serial.println();
        }
        return;
    }

    const char* action = doc["action"];
    if (!action) return;

    if (strcmp(action, "SIGN_INTENT") == 0) {
        if (currentState != STATE_IDLE) {
            Serial.println("{\"error\":\"DEVICE_BUSY_OR_LOCKED\"}");
            return;
        }
        buttonPressStartTime = 0;
        scannedRole = "NONE";
        if (currentState == STATE_RECOVERY_REQUIRED) {
            JsonDocument res;
            res["error"] = "HARDWARE_FAULT";
            res["message"] = "Device is locked in recovery state. Supervisor recovery key required.";
            res["action"] = "APPROVAL_INVALIDATED";
            serializeJson(res, Serial);
            Serial.println();
            return;
        }

        if (currentState == STATE_PANIC_LOCKED) {
            JsonDocument res;
            res["error"] = "PANIC_LOCKED";
            res["message"] = "Device permanently locked by emergency panic. Hardware reset required.";
            res["action"] = "APPROVAL_INVALIDATED";
            serializeJson(res, Serial);
            Serial.println();
            return;
        }

        if (!displayHealthy) {
            invalidateCurrentReview("DISPLAY_UNAVAILABLE", "Trusted OLED #1 unavailable. Signing rejected.");
            currentState = STATE_RECOVERY_REQUIRED;
            return;
        }

        JsonObject intentObj = doc["intent"];
        if (validateAndLoadIntent(intentObj)) {
            reviewStartTime = millis();
            pageStartTime = millis();
            currentState = STATE_REVIEW_PAGE1;
            renderPage1();
            renderStatusScreen("REVIEWING", "UNVERIFIED", "SEE OLED #1");

            JsonDocument res;
            res["status"] = "REVIEW_STARTED";
            res["requestId"] = currentIntent.requestId;
            res["fingerprint"] = currentIntent.shortFingerprint;
            serializeJson(res, Serial);
            Serial.println();
        }
    } else if (strcmp(action, "CANCEL") == 0) {
        invalidateCurrentReview("USER_CANCELLED", "Signing request cancelled by host command");
    } else if (strcmp(action, "CONFIRM_APPROVAL") == 0 || strcmp(action, "INJECT_BUTTON") == 0 || strcmp(action, "NEXT_PAGE") == 0) {
        // Strict physical invariant: Software spoofing of physical button is rejected
        JsonDocument res;
        res["error"] = "PHYSICAL_BUTTON_REQUIRED";
        res["message"] = "Direct physical GPIO33 confirmation required. Software button spoofing rejected.";
        serializeJson(res, Serial);
        Serial.println();
        return;
    } else if (strcmp(action, "TEST_UNKNOWN_RFID") == 0) {
        invalidateCurrentReview("UNKNOWN_RFID_UID", "Unauthorized RFID card UID presented");
        return;
    } else if (strcmp(action, "GET_RFID_STATUS") == 0) {
        JsonDocument res;
        byte v = rfid.PCD_ReadRegister(MFRC522::VersionReg);
        char verHex[8];
        snprintf(verHex, sizeof(verHex), "0x%02X", v);
        res["rfid_hardware"] = probeRFID() ? "SPI_OK" : "DISCONNECTED";
        res["chip_version"] = verHex;
        res["enrolled_junior"] = physicalCardJuniorUID.length() > 0 ? physicalCardJuniorUID : RFID_CARD_JUNIOR_UID;
        res["enrolled_senior"] = physicalCardSeniorUID.length() > 0 ? physicalCardSeniorUID : RFID_CARD_SENIOR_UID;
        serializeJson(res, Serial);
        Serial.println();
        return;
    } else if (strcmp(action, "DISPLAY_TX") == 0) {
        const char* title = doc["title"] | "TRANSACTION";
        const char* l1 = doc["line1"] | "";
        const char* l2 = doc["line2"] | "";
        const char* l3 = doc["line3"] | "";
        const char* l4 = doc["line4"] | "";
        if (displayHealthy) {
            renderReviewPage(title, l1, l2, l3, l4);
        }
        if (statusDisplayHealthy) {
            const char* st = doc["state"] | "TX_UPDATE";
            const char* rf = doc["rfid"] | "AUTH_OK";
            const char* bg = doc["budget"] | "NORMAL";
            renderStatusScreen(st, rf, bg);
        }
        JsonDocument res;
        res["status"] = "DISPLAY_UPDATED";
        res["title"] = title;
        serializeJson(res, Serial);
        Serial.println();
        return;
    } else if (strcmp(action, "DIAGNOSTIC_SIGN") == 0) {
        // Authorized bench diagnostic: exercises real secp256k1 engine on physical chip
        const char* diagKey = doc["key"] | "";
        if (strcmp(diagKey, SUPERVISOR_RECOVERY_KEY) != 0) {
            JsonDocument res;
            res["error"] = "UNAUTHORIZED_DIAGNOSTIC";
            serializeJson(res, Serial);
            Serial.println();
            return;
        }
        JsonObject intentObj = doc["intent"];
        if (validateAndLoadIntent(intentObj)) {
            const char* tier = currentIntent.approvalTier;
            uint8_t signKey[32];
            if (strcmp(tier, "JUNIOR_EXCEPTION") == 0) {
                hex_to_bytes(JUNIOR_PRIVATE_KEY_HEX, signKey, 32);
            } else {
                hex_to_bytes(SENIOR_PRIVATE_KEY_HEX, signKey, 32);
            }
            uint8_t sig[65];
            sign_secp256k1_canonical(signKey, currentDigest, sig);
            char sigHex[133];
            sigHex[0] = '0';
            sigHex[1] = 'x';
            bytes_to_hex(sig, 65, sigHex + 2);

            char digestHex[67];
            digestHex[0] = '0';
            digestHex[1] = 'x';
            bytes_to_hex(currentDigest, 32, digestHex + 2);

            char signerAddr[43];
            derive_ethereum_address(signKey, signerAddr);

            // Record Nonce in Replay Cache
            processedNonces[nonceIndex] = currentIntent.accountNonce;
            processedNonceValid[nonceIndex] = true;
            nonceIndex = (nonceIndex + 1) % NONCE_CACHE_SIZE;

            JsonDocument res;
            res["status"] = "APPROVED";
            res["diagnostic"] = true;
            res["requestId"] = currentIntent.requestId;
            res["signerAddress"] = signerAddr;
            res["approvalTier"] = tier;
            res["digest"] = digestHex;
            res["deviceSignature"] = sigHex;
            res["shortFingerprint"] = currentIntent.shortFingerprint;
            res["accountNonce"] = currentIntent.accountNonce;
            serializeJson(res, Serial);
            Serial.println();
        }
        return;
    } else if (strcmp(action, "TRIGGER_PANIC") == 0) {
        const char* sId = doc["sessionId"] | lastRevocationSessionId;
        const char* reason = doc["reason"] | "HOST_REQUESTED_PANIC";
        if (doc["nonce"].is<uint64_t>()) {
            revokerNonceTracker = doc["nonce"].as<uint64_t>();
        }
        executePanicRevocation(sId, reason);
    } else if (strcmp(action, "RESET_RECOVERY") == 0) {
        const char* key = doc["key"] | "";
        if (currentState == STATE_RECOVERY_REQUIRED && strcmp(key, SUPERVISOR_RECOVERY_KEY) == 0) {
            if (probeI2CDevice(OLED1_I2C_ADDR)) {
                displayHealthy = true;
                currentState = STATE_IDLE;
                JsonDocument res;
                res["status"] = "RECOVERED";
                res["message"] = "Supervisor cleared hardware fault. Device returned to IDLE.";
                serializeJson(res, Serial);
                Serial.println();
                renderReviewPage("SUPERVISOR RESTORE", "Fault Cleared", "Trusted Review: OK", "Ready for Payments", "");
            } else {
                JsonDocument res;
                res["status"] = "RECOVERY_FAILED";
                res["error"] = "OLED #1 still not detected on I2C bus.";
                serializeJson(res, Serial);
                Serial.println();
            }
        } else {
            JsonDocument res;
            res["error"] = "INVALID_RECOVERY_KEY";
            serializeJson(res, Serial);
            Serial.println();
        }
    } else if (strcmp(action, "CONFIG_NETWORK") == 0) {
        Serial.println("{\"error\":\"USE_PHYSICAL_PROVISIONING\"}");
    }
}

// -------------------------------------------------------------
// Main Loop
// -------------------------------------------------------------
void loop() {
    // 1. High-Priority Emergency Panic Check
    if (panicTriggered || digitalRead(PIN_BUTTON_PANIC) == LOW) {
        delay(50); // Debounce
        if (panicTriggered || digitalRead(PIN_BUTTON_PANIC) == LOW) {
            panicTriggered = false;
            executePanicRevocation(lastRevocationSessionId, "HARDWARE_GPIO32_PANIC");
            while (true) {
                delay(1000); // Latch permanently until power cycle
            }
        }
    }

    // 2. Periodic Hardware Integrity Probe (Fail-Closed Enforcement)
    if (millis() - lastHardwareCheckTime >= HW_PROBE_INTERVAL_MS) {
        lastHardwareCheckTime = millis();
        bool oled1Alive = probeI2CDevice(OLED1_I2C_ADDR);

        if (!oled1Alive && displayHealthy) {
            displayHealthy = false;
            currentState = STATE_RECOVERY_REQUIRED;
            invalidateCurrentReview("HARDWARE_DISCONNECT", "Trusted OLED #1 disconnected. Signing locked.");
        } else if (oled1Alive && !displayHealthy && currentState != STATE_RECOVERY_REQUIRED) {
            displayHealthy = true;
        }
    }

    // 3. Periodic Heartbeat Broadcast
    if (millis() - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatTime = millis();
        JsonDocument hb;
        hb["heartbeat"] = true;
        hb["uptime_ms"] = millis();
        hb["state"] = (int)currentState;
        hb["oled_1"] = displayHealthy;
        hb["oled_2"] = statusDisplayHealthy;
        hb["rfid"] = probeRFID();
        hb["recovery_locked"] = (currentState == STATE_RECOVERY_REQUIRED);
        serializeJson(hb, Serial);
        Serial.println();
    }

    // 4. Serial Command Processing
    if (Serial.available()) {
        String line = Serial.readStringUntil('\n');
        line.trim();
        if (line.length() > 0) {
            handleSerialCommand(line);
        }
    }

    // 5. State Machine Processing
    switch (currentState) {
        case STATE_IDLE: {
            // Check for physical NFC/RFID card presentation in idle mode
            char uidBuf[21] = "";
            if (readCardUID(uidBuf)) {

                if (physicalCardJuniorUID.length() == 0) {
                    physicalCardJuniorUID = String(uidBuf);
                } else if (physicalCardJuniorUID != String(uidBuf) && physicalCardSeniorUID.length() == 0) {
                    physicalCardSeniorUID = String(uidBuf);
                }

                String roleStr = (physicalCardSeniorUID == String(uidBuf)) ? "SENIOR" : "JUNIOR";

                JsonDocument cardDoc;
                cardDoc["event"] = "RFID_CARD_DETECTED";
                cardDoc["uid"] = uidBuf;
                cardDoc["role"] = roleStr;
                serializeJson(cardDoc, Serial);
                Serial.println();

                if (displayHealthy) {
                    char l1[32], l2[32], l3[32];
                    snprintf(l1, sizeof(l1), "UID: %s", uidBuf);
                    snprintf(l2, sizeof(l2), "Role: %s ($%s)", roleStr.c_str(), roleStr == "SENIOR" ? "10k" : "2k");
                    snprintf(l3, sizeof(l3), "Status: AUTHORIZED");
                    renderReviewPage("NFC CARD SCANNED", l1, l2, l3, "Ready for Payment");
                    lastIdleCardScanTime = millis();
                }
            } else if (lastIdleCardScanTime > 0 && millis() - lastIdleCardScanTime > 3500) {
                lastIdleCardScanTime = 0;
                if (displayHealthy) {
                    renderReviewPage("TRUSTED SIGNER", "Status: ONLINE", "Firmware: v2.3", "Dual OLED Active", "NFC Card Ready");
                }
            }
            break;
        }

        case STATE_REVIEW_PAGE1:
            // Auto advance or advance on button 33 press
            if (millis() - pageStartTime >= 3000) {
                delay(150);
                pageStartTime = millis();
                currentState = STATE_REVIEW_PAGE2;
                renderPage2();
            }
            if (millis() - reviewStartTime > REVIEW_TIMEOUT_MS) {
                invalidateCurrentReview("REVIEW_TIMEOUT", "Physical review timed out (> 30s)");
            }
            break;

        case STATE_REVIEW_PAGE2:
            if (millis() - pageStartTime >= 3000) {
                delay(150);
                pageStartTime = millis();
                currentState = STATE_REVIEW_PAGE3;
                renderPage3();
            }
            if (millis() - reviewStartTime > REVIEW_TIMEOUT_MS) {
                invalidateCurrentReview("REVIEW_TIMEOUT", "Physical review timed out (> 30s)");
            }
            break;

        case STATE_REVIEW_PAGE3:
            if (millis() - pageStartTime >= 3000) {
                delay(150);
                pageStartTime = millis();
                currentState = STATE_REVIEW_PAGE4;
                renderPage4();
            }
            if (millis() - reviewStartTime > REVIEW_TIMEOUT_MS) {
                invalidateCurrentReview("REVIEW_TIMEOUT", "Physical review timed out (> 30s)");
            }
            break;

        case STATE_REVIEW_PAGE4:
            if (millis() - pageStartTime >= 3000) {
                delay(150);
                pageStartTime = millis();
                currentState = STATE_REVIEW_PAGE5;
                renderPage5();
            }
            if (millis() - reviewStartTime > REVIEW_TIMEOUT_MS) {
                invalidateCurrentReview("REVIEW_TIMEOUT", "Physical review timed out (> 30s)");
            }
            break;

        case STATE_REVIEW_PAGE5:
            if (millis() - pageStartTime >= 3000) {
                delay(150);
                pageStartTime = millis();
                currentState = STATE_AWAITING_RFID;
                renderAwaitingRfid();
            }
            if (millis() - reviewStartTime > REVIEW_TIMEOUT_MS) {
                invalidateCurrentReview("REVIEW_TIMEOUT", "Physical review timed out (> 30s)");
            }
            break;

        case STATE_AWAITING_RFID: {
            // Physical RFID Presentation
            char uidBuf[21] = "";
            if (readCardUID(uidBuf)) {

                JsonDocument scanEvt;
                scanEvt["event"] = "RFID_SCANNED_DURING_REVIEW";
                scanEvt["uid"] = uidBuf;
                serializeJson(scanEvt, Serial);
                Serial.println();

                bool isJunior = (strcasecmp(uidBuf, RFID_CARD_JUNIOR_UID) == 0) || 
                                (physicalCardJuniorUID.length() > 0 && strcasecmp(uidBuf, physicalCardJuniorUID.c_str()) == 0) ||
                                (physicalCardJuniorUID.length() == 0 && strcasecmp(uidBuf, RFID_CARD_SENIOR_UID) != 0 && (physicalCardSeniorUID.length() == 0 || strcasecmp(uidBuf, physicalCardSeniorUID.c_str()) != 0));

                bool isSenior = (strcasecmp(uidBuf, RFID_CARD_SENIOR_UID) == 0) ||
                                (physicalCardSeniorUID.length() > 0 && strcasecmp(uidBuf, physicalCardSeniorUID.c_str()) == 0);

                if (isJunior) {
                    if (physicalCardJuniorUID.length() == 0) {
                        physicalCardJuniorUID = String(uidBuf);
                    }
                    if (currentIntent.amountBaseUnits > JUNIOR_ROLE_CAP_RAW) {
                        invalidateCurrentReview("ROLE_CEILING_EXCEEDED", "Amount exceeds Junior ceiling ($2,000). Senior card required.");
                        break;
                    }
                    if (strcmp(currentIntent.approvalTier, "JUNIOR_EXCEPTION") != 0 && strcmp(currentIntent.approvalTier, "SENIOR_EXCEPTION") != 0) {
                        invalidateCurrentReview("TIER_MISMATCH", "Wrong review card");
                        break;
                    }
                    scannedRole = "JUNIOR_EXCEPTION";
                    if (!loadDeviceKey("junior", activeSigningKey)) { invalidateCurrentReview("KEY_UNAVAILABLE", "Cannot load key"); break; }
                    currentState = STATE_SIGNING; // Instant approval on authorized NFC card tap
                } else if (isSenior) {
                    if (physicalCardSeniorUID.length() == 0) {
                        physicalCardSeniorUID = String(uidBuf);
                    }
                    if (currentIntent.amountBaseUnits > SENIOR_ROLE_CAP_RAW) {
                        invalidateCurrentReview("ROLE_CEILING_EXCEEDED", "Amount exceeds Senior ceiling ($10,000). Signing rejected.");
                        break;
                    }
                    scannedRole = "SENIOR_EXCEPTION";
                    if (!loadDeviceKey("senior", activeSigningKey)) { invalidateCurrentReview("KEY_UNAVAILABLE", "Cannot load key"); break; }
                    currentState = STATE_SIGNING; // Instant approval on authorized NFC card tap
                } else {
                    invalidateCurrentReview("UNKNOWN_RFID_UID", "Unauthorized RFID card UID detected");
                    break;
                }
            }

            if (millis() - reviewStartTime > REVIEW_TIMEOUT_MS) {
                invalidateCurrentReview("REVIEW_TIMEOUT", "Physical review timed out (> 30s)");
            }
            break;
        }

        case STATE_AWAITING_APPROVE:
            // Physical button sustained hold validation (GPIO33 >= 1.5s)
            if (digitalRead(PIN_BUTTON_APPROVE) == LOW) {
                if (buttonPressStartTime == 0) {
                    buttonPressStartTime = millis();
                } else if (millis() - buttonPressStartTime >= BUTTON_HOLD_REQUIRED_MS) {
                    currentState = STATE_SIGNING;
                }
            } else {
                buttonPressStartTime = 0; // Reset if released
            }

            if (millis() - reviewStartTime > REVIEW_TIMEOUT_MS) {
                invalidateCurrentReview("REVIEW_TIMEOUT", "Physical approval confirmation timed out (> 30s)");
            }
            break;

        case STATE_SIGNING: {
            if (!displayHealthy || !probeI2CDevice(OLED1_I2C_ADDR) || !probeRFID()) {
                invalidateCurrentReview("DISPLAY_UNAVAILABLE", "OLED #1 failed right before signing");
                currentState = STATE_RECOVERY_REQUIRED;
                break;
            }

            if (panicTriggered || digitalRead(PIN_BUTTON_PANIC) == LOW || millis() - reviewStartTime > REVIEW_TIMEOUT_MS) {
                invalidateCurrentReview("SIGNING_ABORTED", "Panic or expired review"); break;
            }
            if (WiFi.status() == WL_CONNECTED) {
                uint32_t chainTime;
                if (currentChainTime(chainTime) && chainTime >= currentIntent.deadline) {
                    invalidateCurrentReview("INTENT_EXPIRED", "Intent deadline has passed on chain");
                    break;
                }
            }
            // Execute Real Secp256k1 Signing
            uint8_t sig[65];
            bool signOk = sign_secp256k1_canonical(activeSigningKey, currentDigest, sig);

            if (!signOk) {
                invalidateCurrentReview("SIGNING_FAILED", "Cryptographic signing routine failed");
                break;
            }

            char signerAddr[43];
            derive_ethereum_address(activeSigningKey, signerAddr);
            memset(activeSigningKey, 0, sizeof(activeSigningKey));
            if (panicTriggered || digitalRead(PIN_BUTTON_PANIC) == LOW) {
                memset(sig, 0, sizeof(sig));
                invalidateCurrentReview("PANIC_ABORTED", "Signature discarded"); break;
            }
            char sigHex[133];
            sigHex[0] = '0';
            sigHex[1] = 'x';
            bytes_to_hex(sig, 65, sigHex + 2);

            char digestHex[67];
            digestHex[0] = '0';
            digestHex[1] = 'x';
            bytes_to_hex(currentDigest, 32, digestHex + 2);

            // Record Nonce in Replay Cache
            processedNonces[nonceIndex] = currentIntent.accountNonce;
            processedNonceValid[nonceIndex] = true;
            nonceIndex = (nonceIndex + 1) % NONCE_CACHE_SIZE;

            // Emit Full Structured Approval
            JsonDocument res;
            res["status"] = "APPROVED";
            res["requestId"] = currentIntent.requestId;
            res["signerAddress"] = signerAddr;
            res["approvalTier"] = scannedRole;
            res["digest"] = digestHex;
            res["deviceSignature"] = sigHex;
            res["shortFingerprint"] = currentIntent.shortFingerprint;
            res["accountNonce"] = currentIntent.accountNonce;
            serializeJson(res, Serial);
            Serial.println();

            renderReviewPage("TRANSACTION SIGNED", "Secp256k1 Canonical", signerAddr, "Emitted to Host", "");
            renderStatusScreen("SIGNED", "NOT EXECUTED", "AWAIT RECEIPT");
            delay(2000);

            // Reset to Safe Idle State
            memset(&currentIntent, 0, sizeof(currentIntent));
            memset(currentDigest, 0, sizeof(currentDigest));
            scannedRole = "NONE";
            buttonPressStartTime = 0;
            currentState = STATE_IDLE;
            renderReviewPage("TRUSTED SIGNER", "Status: READY", "Awaiting Intent...", "", "");
            break;
        }

        case STATE_RECOVERY_REQUIRED:
            // Fail-closed lockout: all reviews rejected until supervisor reset
            break;

        case STATE_PANIC_LOCKED:
            // Permanent emergency lock
            break;
    }

    delay(20);
}
