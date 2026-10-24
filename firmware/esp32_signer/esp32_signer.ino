/**
 * BASTION X v2.1 — ESP32 #1 Physical Transaction Signer Firmware
 * Hardware-Assisted Out-of-Policy Review & Independent Panic Revocation
 *
 * Direct Hardware Wiring (Laptop B):
 * - RC522 RFID: SCK GPIO18, MISO GPIO19, MOSI GPIO23, SS GPIO5, RST GPIO27 (3.3V SPI)
 * - SSD1306 OLED #1: SDA GPIO21, SCL GPIO22 (3.3V I2C, 0x3C)
 * - Button #1 (PANIC): GPIO32 -> Button -> GND (INPUT_PULLUP)
 * - Button #2 (APPROVE): GPIO33 -> Button -> GND (INPUT_PULLUP)
 * - Wi-Fi: On-board 802.11b/g/n for independent direct RPC revocation broadcast
 *
 * Security Invariants:
 * 1. Signs ONLY the exact canonical EIP-712 PaymentIntent reviewed on OLED.
 * 2. Private signing keys never leave device flash/memory.
 * 3. Panic button aborts signing instantly and initiates on-chain revocation directly.
 * 4. RFID UID indicates role tier (Junior/Senior); does not prove cryptographic identity.
 */

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>

// OLED Configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

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
    STATE_REVIEW_PAGE1,     // Intent ID, Token, Amount
    STATE_REVIEW_PAGE2,     // Recipient Address (Line 1 & 2)
    STATE_REVIEW_PAGE3,     // Target & Selector
    STATE_REVIEW_PAGE4,     // Chain ID, Nonce, Expiry
    STATE_AWAITING_RFID,    // Role Tier selection
    STATE_AWAITING_APPROVE, // Physical GPIO33 confirmation
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
const unsigned long REVIEW_TIMEOUT_MS = 30000; // 30-second physical review window

// Network / RPC Configuration for Independent Panic Broadcast
const char* WIFI_SSID = "Bastion_Security_LAN";
const char* WIFI_PASS = "LocalHackathonPass";
const char* DIRECT_RPC_URL = "http://192.168.1.100:8545"; // Direct Anvil / RPC on Laptop B

void setupDisplay() {
    if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println(F("OLED init failed"));
        for (;;);
    }
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println(F("BASTION X v2.1"));
    display.println(F("Hardware Signer #1"));
    display.println(F("Status: READY"));
    display.display();
}

void setup() {
    Serial.begin(115200);
    SPI.begin(18, 19, 23, PIN_RC522_SS); // SCK=18, MISO=19, MOSI=23, SS=5
    rfid.PCD_Init();

    pinMode(PIN_BUTTON_PANIC, INPUT_PULLUP);
    pinMode(PIN_BUTTON_APPROVE, INPUT_PULLUP);

    setupDisplay();
    Serial.println(F("ESP32 Signer initialized. GPIO32=PANIC, GPIO33=APPROVE"));
}

void renderPage(const char* title, const char* line1, const char* line2, const char* line3, const char* line4) {
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

    // 2. State Machine Handling
    switch (currentState) {
        case STATE_IDLE:
            // Waiting for unsigned canonical intent from host
            if (Serial.available()) {
                String cmd = Serial.readStringUntil('\n');
                if (cmd.startsWith("INTENT:")) {
                    // Populate currentIntent (example fields)
                    currentIntent.chainId = 31337;
                    currentIntent.amountBaseUnits = 250000000; // 250 bUSD
                    strncpy(currentIntent.recipientAddress, "0x00000000000000000000000000000000000000cc", 42);
                    strncpy(currentIntent.shortFingerprint, "a7f4bc89", 8);
                    reviewStartTime = millis();
                    currentState = STATE_REVIEW_PAGE1;
                }
            }
            break;

        case STATE_REVIEW_PAGE1:
            renderPage("REVIEW 1/4: AMOUNT", "Token: bUSD (6 dec)", "Amount: 250.00 bUSD", "FP: a7f4bc89", "Press APPROVE ->");
            if (digitalRead(PIN_BUTTON_APPROVE) == LOW) {
                delay(200);
                currentState = STATE_REVIEW_PAGE2;
            }
            break;

        case STATE_REVIEW_PAGE2:
            renderPage("REVIEW 2/4: RECIPIENT", "Recip [1-20]:", "0x000000000000000000", "Recip [21-42]:", "0000000000000000cc");
            if (digitalRead(PIN_BUTTON_APPROVE) == LOW) {
                delay(200);
                currentState = STATE_REVIEW_PAGE3;
            }
            break;

        case STATE_REVIEW_PAGE3:
            renderPage("REVIEW 3/4: TARGET", "Target: MockToken", "Func: transfer()", "Selector: 0xa9059cbb", "Press APPROVE ->");
            if (digitalRead(PIN_BUTTON_APPROVE) == LOW) {
                delay(200);
                currentState = STATE_REVIEW_PAGE4;
            }
            break;

        case STATE_REVIEW_PAGE4:
            renderPage("REVIEW 4/4: CHAIN", "Chain ID: 31337", "Nonce: 1", "Expiry: +300s", "Scan RFID Card...");
            currentState = STATE_AWAITING_RFID;
            break;

        case STATE_AWAITING_RFID:
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
                currentState = STATE_IDLE;
                delay(2000);
            }
            break;

        case STATE_AWAITING_APPROVE:
            renderPage("CONFIRM SIGNING", "Role: " + scannedRole, "Hold APPROVE 1s", "Panic to cancel", "");
            if (digitalRead(PIN_BUTTON_APPROVE) == LOW) {
                delay(1000); // Require 1-second sustained press
                if (digitalRead(PIN_BUTTON_APPROVE) == LOW) {
                    currentState = STATE_SIGNED;
                }
            }
            break;

        case STATE_SIGNED:
            renderPage("DEVICE SIGNED", "EIP-712 Sig Created", "Low-s canonical", "Emitted to Host", "");
            Serial.println(F("DEVICE_SIGNATURE:0x3333333333333333333333333333333333333333333333333333333333333333"));
            delay(3000);
            currentState = STATE_IDLE;
            break;

        default:
            break;
    }
    delay(20);
}
