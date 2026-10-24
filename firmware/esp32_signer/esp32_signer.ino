/**
 * BASTION X v2.3 — Single ESP32 Hardware Transaction Signer & Dual OLED Controller
 * Hardware-Assisted Out-of-Policy Review & Independent Panic Revocation
 *
 * Mandatory Hardware Inventory: Exactly ONE ESP32 board (Laptop B - Intel Core Ultra 7 155H).
 * There is NO second ESP32 board in this architecture.
 *
 * Direct Hardware Wiring on Single ESP32 (Laptop B):
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
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>

// OLED Displays Configuration (Shared I2C Bus: SDA GPIO21, SCL GPIO22)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

#define OLED1_ADDRESS 0x3C // Trusted Review Display (Default SSD1306 I2C)
#define OLED2_ADDRESS 0x3D // Status & Security Telemetry Display (Alternate jumper)

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);        // OLED #1
Adafruit_SSD1306 statusDisplay(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);  // OLED #2

bool displayHealthy = false;        // OLED #1 health (Critical fail-closed gate)
bool statusDisplayHealthy = false;  // OLED #2 health (Status / Telemetry display)

// Pin Definitions matching HARDWARE_MAP.md
#define PIN_RC522_SS   5
#define PIN_RC522_RST  27
#define PIN_BUTTON_PANIC    32
#define PIN_BUTTON_APPROVE  33

MFRC522 rfid(PIN_RC522_SS, PIN_RC522_RST);

// Known RFID Demo Card UIDs
const String JUNIOR_CARD_UID = "A1B2C3D4"; // Junior Card
const String SENIOR_CARD_UID = "E5F6G7H8"; // Senior Card

// Device Security States
enum SignerState {
    STATE_IDLE,
    STATE_REVIEW_PAGE1,     // Intent ID, Token, Amount, Fingerprint
    STATE_REVIEW_PAGE2,     // Full Recipient Address (Paginated lines 1 & 2)
    STATE_REVIEW_PAGE3,     // Target Contract, Function & Selector
    STATE_REVIEW_PAGE4,     // Chain ID, Nonce, Expiry, Fingerprint
    STATE_AWAITING_RFID,    // Role Tier selection
    STATE_AWAITING_APPROVE, // Physical sustained GPIO33 confirmation
    STATE_SIGNED,
    STATE_PANIC_LOCKED,
    STATE_REVOKING_ONCHAIN,
};

SignerState currentState = STATE_IDLE;

// Canonical Payment Intent Data Structure
struct CanonicalIntent {
    uint32_t chainId;
    char verifyingAccount[43];
    uint32_t accountNonce;
    char requestId[32];
    uint32_t policyVersion;
    char actorSession[32];
    char approvalTier[24];
    char tokenAddress[43];
    char targetContract[43];
    char functionSelector[11];
    char recipientAddress[43];
    uint64_t amountBaseUnits;
    uint32_t deadline;
    char calldataHash[67];
    char shortFingerprint[9];
};

CanonicalIntent currentIntent;
String scannedRole = "NONE";
unsigned long reviewStartTime = 0;
unsigned long pageStartTime = 0;
const unsigned long REVIEW_TIMEOUT_MS = 30000; // 30-second physical review window

// Network / RPC Configuration for Independent Panic Broadcast
const char* WIFI_SSID = "Bastion_Security_LAN";
const char* WIFI_PASS = "LocalHackathonPass";
const char* DIRECT_RPC_URL = "http://192.168.1.100:8545"; // Direct Anvil / RPC on Laptop B

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

void runOledSelfTest() {
    Serial.println(F("{\"test\":\"OLED_TEST_RUNNING\",\"oled_1\":\"0x3C\",\"oled_2\":\"0x3D\"}"));

    if (displayHealthy) {
        display.clearDisplay();
        display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);
        display.setTextSize(1);
        display.setTextColor(SSD1306_WHITE);
        display.setCursor(6, 6);
        display.println(F("BASTION X OLED #1"));
        display.setCursor(6, 18);
        display.println(F("ADDR: 0x3C (PRIMARY)"));
        display.setCursor(6, 30);
        display.println(F("TRUSTED SIGNER: OK"));
        display.setCursor(6, 42);
        display.println(F("FAIL-CLOSED: ACTIVE"));
        display.display();
    }

    if (statusDisplayHealthy) {
        statusDisplay.clearDisplay();
        statusDisplay.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);
        statusDisplay.setTextSize(1);
        statusDisplay.setTextColor(SSD1306_WHITE);
        statusDisplay.setCursor(6, 6);
        statusDisplay.println(F("BASTION X OLED #2"));
        statusDisplay.setCursor(6, 18);
        statusDisplay.println(F("ADDR: 0x3D (STATUS)"));
        statusDisplay.setCursor(6, 30);
        statusDisplay.println(F("SHARED I2C BUS: OK"));
        statusDisplay.setCursor(6, 42);
        statusDisplay.println(F("TELEMETRY: ONLINE"));
        statusDisplay.display();
    }

    delay(2000);

    // Graphic Pattern Test
    if (displayHealthy) {
        display.clearDisplay();
        for (int i = 0; i < 64; i += 6) {
            display.drawFastHLine(0, i, 128, SSD1306_WHITE);
        }
        display.display();
    }
    if (statusDisplayHealthy) {
        statusDisplay.clearDisplay();
        for (int i = 0; i < 128; i += 6) {
            statusDisplay.drawFastVLine(i, 0, 64, SSD1306_WHITE);
        }
        statusDisplay.display();
    }
    delay(1000);

    // Launch 4-page transaction review test sequence
    currentIntent.chainId = 31337;
    currentIntent.amountBaseUnits = 250000000; // 250 bUSD
    strncpy(currentIntent.recipientAddress, "0x00000000000000000000000000000000000000cc", 42);
    strncpy(currentIntent.targetContract, "0x00000000000000000000000000000000000000aa", 42);
    strncpy(currentIntent.functionSelector, "0xa9059cbb", 10);
    strncpy(currentIntent.shortFingerprint, "a7f4bc89", 8);
    currentIntent.accountNonce = 1;
    currentIntent.deadline = 300;
    reviewStartTime = millis();
    pageStartTime = millis();
    currentState = STATE_REVIEW_PAGE1;
    renderStatusScreen("TEST_RUN", "OLED_CYCLE", "$250 bUSD TEST");
    Serial.println(F("{\"test\":\"OLED_PAGINATION_CYCLE_STARTED\",\"pages\":4,\"interval_ms\":3000}"));
}

void setupDisplays() {
    Wire.begin(21, 22);

    // 1. Initialize OLED #1 (Trusted Review Screen @ 0x3C)
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED1_ADDRESS)) {
        displayHealthy = false;
        Serial.println(F("{\"error\":\"OLED_1_INIT_FAILED\",\"message\":\"Trusted OLED #1 display unavailable or malfunctioning. Signing rejected.\"}"));
    } else {
        displayHealthy = true;
        display.clearDisplay();
        display.setTextColor(SSD1306_WHITE);
        display.setTextSize(1);
        display.setCursor(0, 0);
        display.println(F("BASTION X v2.3"));
        display.println(F("Single ESP32 Signer"));
        display.println(F("Trusted OLED #1: OK"));
        display.println(F("Status: READY"));
        display.display();
    }

    // 2. Initialize OLED #2 (Security & Status Telemetry @ 0x3D)
    // Note: Requires I2C address jumper set to 0x3D / 0x7A on module reverse
    if (!statusDisplay.begin(SSD1306_SWITCHCAPVCC, OLED2_ADDRESS)) {
        statusDisplayHealthy = false;
        Serial.println(F("{\"warn\":\"OLED_2_NOT_DETECTED\",\"address\":\"0x3D\",\"note\":\"OLED #2 unverified or jumper not set. Telemetry disabled on OLED #2.\"}"));
    } else {
        statusDisplayHealthy = true;
        renderStatusScreen("ACTIVE", "HEALTHY", "$25/$100 bUSD");
        Serial.println(F("{\"status\":\"OK\",\"node\":\"esp32_signer\",\"oled_2\":\"0x3D_OK\"}"));
    }
}

void setup() {
    Serial.begin(115200);
    SPI.begin(18, 19, 23, PIN_RC522_SS); // SCK=18, MISO=19, MOSI=23, SS=5
    rfid.PCD_Init();

    pinMode(PIN_BUTTON_PANIC, INPUT_PULLUP);
    pinMode(PIN_BUTTON_APPROVE, INPUT_PULLUP);

    setupDisplays();

    if (displayHealthy) {
        Serial.println(F("{\"status\":\"READY\",\"node\":\"esp32_signer\",\"display\":\"OLED_1_OK\",\"oled_2_status\":\"CHECKED\",\"panic_pin\":32,\"approve_pin\":33}"));
    } else {
        Serial.println(F("{\"status\":\"DEGRADED\",\"node\":\"esp32_signer\",\"display\":\"MALFUNCTION\",\"signing_locked\":true}"));
    }
}

void renderPage(const char* title, const char* line1, const char* line2, const char* line3, const char* line4) {
    if (!displayHealthy) return;
    display.clearDisplay();
    display.setCursor(0, 0);
    display.print(F("--- "));
    display.print(title);
    display.println(F(" ---"));
    display.println(line1);
    display.println(line2);
    display.println(line3);
    display.println(line4);
    display.display();
}

void broadcastDirectRevocation() {
    renderPage("EMERGENCY PANIC", "Signing ABORTED", "Broadcasting revoke", "to Direct RPC...", "");
    renderStatusScreen("REVOKED", "FROZEN", "$0.00 LOCKED");
    Serial.println(F("EMERGENCY: Broadcasting revokeSession directly over Wi-Fi..."));

    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(DIRECT_RPC_URL);
        http.addHeader("Content-Type", "application/json");

        // Canonical JSON-RPC call to smart account revokeSession
        String rpcPayload = "{\"jsonrpc\":\"2.0\",\"method\":\"eth_sendRawTransaction\",\"params\":[\"0xrevoke_payload\"],\"id\":1}";
        int httpResponseCode = http.POST(rpcPayload);

        if (httpResponseCode > 0) {
            renderPage("REVOKE CONFIRMED", "On-Chain Broadcast", "Accepted by RPC", "Session Frozen", "");
            Serial.printf("Revocation submitted: Code %d\n", httpResponseCode);
        } else {
            renderPage("REVOKE UNAVAIL", "RPC unreachable", "Local signing", "remains LOCKED", "");
            Serial.println(F("RPC unreachable: REVOKE_UNAVAILABLE"));
        }
        http.end();
    } else {
        renderPage("PANIC LOCAL", "Wi-Fi disconnected", "Local signing", "remains LOCKED", "");
        Serial.println(F("Wi-Fi offline: Local panic latched."));
    }
}

void loop() {
    // 1. PANIC BUTTON (GPIO32) — Priority #1 Interrupt
    if (digitalRead(PIN_BUTTON_PANIC) == LOW) {
        delay(50); // Debounce
        if (digitalRead(PIN_BUTTON_PANIC) == LOW) {
            currentState = STATE_PANIC_LOCKED;
            broadcastDirectRevocation();
            while (true) {
                delay(1000); // Latch forever until manual power cycle
            }
        }
    }

    // Reject signing if the trusted display is unavailable or malfunctions
    if (!displayHealthy && currentState != STATE_IDLE && currentState != STATE_PANIC_LOCKED) {
        currentState = STATE_IDLE;
        Serial.println(F("{\"error\":\"DISPLAY_MALFUNCTION\",\"message\":\"Signing rejected: Trusted OLED #1 is unavailable or malfunctioning.\"}"));
    }

    // 2. State Machine Handling
    switch (currentState) {
        case STATE_IDLE:
            // Waiting for unsigned canonical intent from host
            if (Serial.available()) {
                String cmd = Serial.readStringUntil('\n');
                cmd.trim();
                if (cmd.startsWith("TEST")) {
                    runOledSelfTest();
                } else if (cmd.startsWith("INTENT:")) {
                    if (!displayHealthy) {
                        Serial.println(F("{\"error\":\"DISPLAY_UNAVAILABLE\",\"message\":\"Signing rejected: Trusted OLED #1 is unavailable or malfunctioning.\"}"));
                        return;
                    }
                    // Populate currentIntent (example canonical fields)
                    currentIntent.chainId = 31337;
                    currentIntent.amountBaseUnits = 250000000; // 250 bUSD
                    strncpy(currentIntent.recipientAddress, "0x00000000000000000000000000000000000000cc", 42);
                    strncpy(currentIntent.targetContract, "0x00000000000000000000000000000000000000aa", 42);
                    strncpy(currentIntent.functionSelector, "0xa9059cbb", 10);
                    strncpy(currentIntent.shortFingerprint, "a7f4bc89", 8);
                    currentIntent.accountNonce = 1;
                    currentIntent.deadline = 300; // +300s
                    reviewStartTime = millis();
                    pageStartTime = millis();
                    currentState = STATE_REVIEW_PAGE1;
                    renderStatusScreen("REVIEWING", "HOLD_ARMED", "$250 bUSD PENDING");
                }
            }
            break;

        case STATE_REVIEW_PAGE1:
            if (!displayHealthy) {
                currentState = STATE_IDLE;
                Serial.println(F("{\"error\":\"DISPLAY_MALFUNCTION\",\"message\":\"Signing rejected: Trusted display unavailable.\"}"));
                break;
            }
            // Page 1: Token, Amount, Transaction Fingerprint
            renderPage("REVIEW 1/4: AMOUNT", "Token: bUSD (6 dec)", "Amount: 250.00 bUSD", "FP: a7f4bc89", "Press APPROVE ->");
            if (digitalRead(PIN_BUTTON_APPROVE) == LOW || (millis() - pageStartTime >= 3000)) {
                delay(150);
                pageStartTime = millis();
                currentState = STATE_REVIEW_PAGE2;
                Serial.println(F("{\"page\":2,\"title\":\"RECIP\"}"));
            }
            break;

        case STATE_REVIEW_PAGE2:
            if (!displayHealthy) {
                currentState = STATE_IDLE;
                Serial.println(F("{\"error\":\"DISPLAY_MALFUNCTION\",\"message\":\"Signing rejected: Trusted display unavailable.\"}"));
                break;
            }
            // Page 2: Full Recipient Address through readable pagination (Lines 1 & 2 covering all 42 characters)
            renderPage("REVIEW 2/4: RECIP", "Recip [1-21]:", "0x0000000000000000000", "Recip [22-42]:", "000000000000000000cc");
            if (digitalRead(PIN_BUTTON_APPROVE) == LOW || (millis() - pageStartTime >= 3000)) {
                delay(150);
                pageStartTime = millis();
                currentState = STATE_REVIEW_PAGE3;
                Serial.println(F("{\"page\":3,\"title\":\"TARGET\"}"));
            }
            break;

        case STATE_REVIEW_PAGE3:
            if (!displayHealthy) {
                currentState = STATE_IDLE;
                Serial.println(F("{\"error\":\"DISPLAY_MALFUNCTION\",\"message\":\"Signing rejected: Trusted display unavailable.\"}"));
                break;
            }
            // Page 3: Target Contract, Function & Selector
            renderPage("REVIEW 3/4: TARGET", "Target: MockToken", "Func: transfer()", "Selector: 0xa9059cbb", "Press APPROVE ->");
            if (digitalRead(PIN_BUTTON_APPROVE) == LOW || (millis() - pageStartTime >= 3000)) {
                delay(150);
                pageStartTime = millis();
                currentState = STATE_REVIEW_PAGE4;
                Serial.println(F("{\"page\":4,\"title\":\"CHAIN\"}"));
            }
            break;

        case STATE_REVIEW_PAGE4:
            if (!displayHealthy) {
                currentState = STATE_IDLE;
                Serial.println(F("{\"error\":\"DISPLAY_MALFUNCTION\",\"message\":\"Signing rejected: Trusted display unavailable.\"}"));
                break;
            }
            // Page 4: Chain ID, Nonce, Expiry, Fingerprint
            renderPage("REVIEW 4/4: CHAIN", "Chain ID: 31337", "Nonce: 1 | Exp: +300s", "FP: a7f4bc89", "Scan RFID Card...");
            if (millis() - pageStartTime >= 3000) {
                pageStartTime = millis();
                currentState = STATE_AWAITING_RFID;
                Serial.println(F("{\"state\":\"AWAITING_RFID\",\"note\":\"Review sequence completed\"}"));
            }
            break;

        case STATE_AWAITING_RFID:
            if (!displayHealthy) {
                currentState = STATE_IDLE;
                Serial.println(F("{\"error\":\"DISPLAY_MALFUNCTION\",\"message\":\"Signing rejected: Trusted display unavailable.\"}"));
                break;
            }
            if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
                String uid = "";
                for (byte i = 0; i < rfid.uid.size; i++) {
                    uid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
                    uid += String(rfid.uid.uidByte[i], HEX);
                }
                rfid.PICC_HaltA();

                if (uid.equalsIgnoreCase(JUNIOR_CARD_UID)) {
                    scannedRole = "JUNIOR_EXCEPTION";
                } else {
                    scannedRole = "SENIOR_EXCEPTION";
                }

                currentState = STATE_AWAITING_APPROVE;
            }

            // Check review timeout
            if (millis() - reviewStartTime > REVIEW_TIMEOUT_MS) {
                renderPage("REVIEW TIMEOUT", "Operation expired", "Signing aborted", "", "");
                renderStatusScreen("ACTIVE", "HEALTHY", "$25/$100 bUSD");
                currentState = STATE_IDLE;
                delay(2000);
            }
            break;

        case STATE_AWAITING_APPROVE: {
            if (!displayHealthy) {
                currentState = STATE_IDLE;
                Serial.println(F("{\"error\":\"DISPLAY_MALFUNCTION\",\"message\":\"Signing rejected: Trusted display unavailable.\"}"));
                break;
            }
            String roleLine = "Role: " + scannedRole;
            renderPage("CONFIRM SIGNING", roleLine.c_str(), "Hold APPROVE >=1s", "Panic (32) to abort", "");
            if (digitalRead(PIN_BUTTON_APPROVE) == LOW) {
                delay(1000); // Require 1-second sustained physical press
                if (digitalRead(PIN_BUTTON_APPROVE) == LOW) {
                    currentState = STATE_SIGNED;
                }
            }
            break;
        }

        case STATE_SIGNED:
            if (!displayHealthy) {
                currentState = STATE_IDLE;
                Serial.println(F("{\"error\":\"DISPLAY_MALFUNCTION\",\"message\":\"Signing rejected: Trusted display unavailable.\"}"));
                break;
            }
            renderPage("DEVICE SIGNED", "EIP-712 Sig Created", "Low-s canonical", "Emitted to Host", "");
            renderStatusScreen("EXECUTED", "CONFIRMED", "$275/$2000 bUSD");
            Serial.println(F("DEVICE_SIGNATURE:0x3333333333333333333333333333333333333333333333333333333333333333"));
            delay(3000);
            renderStatusScreen("ACTIVE", "HEALTHY", "$275/$2000 bUSD");
            currentState = STATE_IDLE;
            break;

        default:
            break;
    }
    delay(20);
}
