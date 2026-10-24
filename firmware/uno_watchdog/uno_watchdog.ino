/**
 * BASTION X v2.3 — Arduino Uno #2 Auxiliary Watchdog & Status OLED Firmware
 * Host Machine: Laptop A (NVIDIA RTX 5060)
 *
 * Hardware Wiring:
 * ┌───────────────┬─────────────────────────────────────────┐
 * │ OLED Pin      │ Arduino Uno Pin                         │
 * ├───────────────┼─────────────────────────────────────────┤
 * │ GND           │ GND                                     │
 * │ VDD / VCC     │ 5V (or 3.3V)                            │
 * │ SCK / SCL     │ A5 (or dedicated SCL pin near AREF)     │
 * │ SDA           │ A4 (or dedicated SDA pin near AREF)     │
 * └───────────────┴─────────────────────────────────────────┘
 * - Built-in LED: Pin 13 (Heartbeat blink)
 * - USB Serial:   9600 baud to Laptop A
 *
 * Security Invariants:
 * 1. Auxiliary diagnostic and status telemetry node ONLY.
 * 2. Strictly FORBIDDEN from issuing cryptographic financial approvals.
 * 3. The ERC-4337 smart wallet must NEVER trust Uno #2 as an authorization source.
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C

Adafruit_SSD1306 oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
bool oledAvailable = false;

#define PIN_LED_HEARTBEAT 13

unsigned long lastHeartbeat = 0;
bool heartbeatState = false;
unsigned long uptimeSeconds = 0;
String simulatedFaultMode = "NONE";

void updateOledDisplay() {
    if (!oledAvailable) return;

    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);

    // Header banner
    oled.setTextSize(1);
    oled.setCursor(14, 2);
    oled.print(F("BASTION X v2.3"));
    oled.drawFastHLine(0, 12, 128, SSD1306_WHITE);

    // Host Domain
    oled.setCursor(0, 16);
    oled.print(F("HOST: Laptop A (5060)"));

    // Heartbeat & Status
    oled.setCursor(0, 27);
    oled.print(F("WATCHDOG: "));
    if (heartbeatState) {
        oled.print(F("[ACTIVE] *"));
    } else {
        oled.print(F("[ACTIVE]  "));
    }

    // Uptime counter
    oled.setCursor(0, 38);
    oled.print(F("UPTIME: "));
    oled.print(uptimeSeconds);
    oled.print(F("s"));

    // Fault Status / Mirage Mode
    oled.drawFastHLine(0, 49, 128, SSD1306_WHITE);
    oled.setCursor(0, 54);
    if (simulatedFaultMode == "NONE") {
        oled.print(F("MODE: HONEYPOT READY"));
    } else {
        oled.print(F("FAULT: "));
        oled.print(simulatedFaultMode);
    }

    oled.display();
}

void setup() {
    Serial.begin(9600);
    pinMode(PIN_LED_HEARTBEAT, OUTPUT);
    digitalWrite(PIN_LED_HEARTBEAT, LOW);

    // Attempt to initialize OLED (Graceful probe, non-blocking if disconnected)
    Wire.begin();
    if (oled.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
        oledAvailable = true;
        oled.clearDisplay();
        oled.setTextColor(SSD1306_WHITE);
        oled.setTextSize(1);
        oled.setCursor(14, 18);
        oled.println(F("BASTION X v2.3"));
        oled.setCursor(10, 32);
        oled.println(F("WATCHDOG READY"));
        oled.display();
        Serial.println(F("{\"status\": \"READY\", \"node\": \"uno_watchdog\", \"oled\": \"0x3C_OK\", \"laptop\": \"A\"}"));
    } else {
        oledAvailable = false;
        Serial.println(F("{\"status\": \"READY\", \"node\": \"uno_watchdog\", \"oled\": \"NOT_DETECTED\", \"laptop\": \"A\"}"));
    }
}

void loop() {
    unsigned long now = millis();

    // 1. Periodic 1-second heartbeat
    if (now - lastHeartbeat >= 1000) {
        lastHeartbeat = now;
        heartbeatState = !heartbeatState;
        uptimeSeconds++;
        digitalWrite(PIN_LED_HEARTBEAT, heartbeatState ? HIGH : LOW);

        // Update physical OLED screen
        updateOledDisplay();

        // Output JSON telemetry over serial to Laptop A
        Serial.print(F("{\"type\":\"watchdog_heartbeat\",\"uptime_s\":"));
        Serial.print(uptimeSeconds);
        Serial.print(F(",\"oled\":"));
        Serial.print(oledAvailable ? F("true") : F("false"));
        Serial.print(F(",\"simulated_fault\":\""));
        Serial.print(simulatedFaultMode);
        Serial.println(F("\"}"));
    }

    // 2. Process incoming commands from Laptop A backend/test suite
    if (Serial.available()) {
        String cmd = Serial.readStringUntil('\n');
        cmd.trim();

        if (cmd == "SIMULATE_FAULT_DISCONNECT") {
            simulatedFaultMode = "DISCONNECT";
            updateOledDisplay();
            Serial.println(F("{\"event\": \"FAULT_INJECTED\", \"type\": \"DISCONNECT\"}"));
        } else if (cmd == "SIMULATE_FAULT_TAMPER") {
            simulatedFaultMode = "TAMPER";
            updateOledDisplay();
            Serial.println(F("{\"event\": \"FAULT_INJECTED\", \"type\": \"TAMPER\"}"));
        } else if (cmd == "CLEAR_FAULT") {
            simulatedFaultMode = "NONE";
            updateOledDisplay();
            Serial.println(F("{\"event\": \"FAULT_CLEARED\"}"));
        } else if (cmd == "PING") {
            Serial.println(F("{\"pong\": true, \"laptop\": \"A\", \"oled\": true}"));
        }
    }
}
