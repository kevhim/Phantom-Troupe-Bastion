/**
 * BASTION X v2.3 — Arduino Uno #2 Auxiliary Watchdog & Status Display Firmware
 * Host Machine: Laptop A (NVIDIA RTX 5060)
 *
 * Hardware Wiring:
 * - OLED VDD / VCC  -> Arduino 5V (or 3.3V)
 * - OLED GND        -> Arduino GND
 * - OLED SCK / SCL  -> Arduino Pin A5 (or dedicated SCL pin near AREF)
 * - OLED SDA        -> Arduino Pin A4 (or dedicated SDA pin near AREF)
 * - Heartbeat LED   -> Arduino Pin 13
 * - USB Serial      -> Laptop A (9600 baud)
 *
 * Security Invariants:
 * 1. Auxiliary diagnostic, status telemetry, and fault-simulation node ONLY.
 * 2. Strictly FORBIDDEN from issuing financial approvals.
 * 3. The ERC-4337 smart wallet must NEVER trust Uno #2 as an authorization source.
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
bool hasDisplay = false;

#define PIN_LED_HEARTBEAT 13

unsigned long lastHeartbeat = 0;
bool heartbeatState = false;
String simulatedFaultMode = "NONE";

void updateOLED(unsigned long uptimeSec, bool pulse) {
    if (!hasDisplay) return;

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // 1. Header Box
    display.setTextSize(1);
    display.setCursor(18, 2);
    display.println(F("=== BASTION X ==="));
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);

    // 2. Node & Role
    display.setCursor(0, 16);
    display.print(F("NODE:  LAPTOP A (5060)\n"));
    display.print(F("ROLE:  WATCHDOG NODE\n"));

    // 3. Status & Keys
    display.print(F("STATE: "));
    if (simulatedFaultMode == "NONE") {
        display.println(F("ARMED [OK]"));
    } else {
        display.println(simulatedFaultMode);
    }

    display.print(F("KEYS:  ISOLATED (PC-B)\n"));
    display.drawLine(0, 52, 127, 52, SSD1306_WHITE);

    // 4. Heartbeat Pulse & Uptime
    display.setCursor(0, 55);
    display.print(F("PULSE: ["));
    display.print(pulse ? F("*") : F(" "));
    display.print(F("]  UP: "));
    display.print(uptimeSec);
    display.print(F("s"));

    display.display();
}

void setup() {
    Serial.begin(9600);
    pinMode(PIN_LED_HEARTBEAT, OUTPUT);
    digitalWrite(PIN_LED_HEARTBEAT, LOW);

    // Initialize I2C and OLED
    Wire.begin();
    if (display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
        hasDisplay = true;
        display.clearDisplay();
        display.setTextColor(SSD1306_WHITE);
        display.setTextSize(1);
        display.setCursor(18, 15);
        display.println(F("BASTION X v2.3"));
        display.setCursor(8, 30);
        display.println(F("Watchdog Initialized"));
        display.setCursor(8, 45);
        display.println(F("Laptop A (RTX 5060)"));
        display.display();
        delay(1500);
    } else {
        hasDisplay = false;
        Serial.println(F("{\"warn\":\"OLED_NOT_DETECTED\",\"note\":\"Operating in headless watchdog mode\"}"));
    }

    Serial.println(F("{\"status\": \"READY\", \"node\": \"uno_watchdog\", \"laptop\": \"A\", \"firmware\": \"v2.3\"}"));
}

void loop() {
    unsigned long now = millis();

    // 1. Periodic Heartbeat Blink (every 1000ms)
    if (now - lastHeartbeat >= 1000) {
        lastHeartbeat = now;
        heartbeatState = !heartbeatState;
        digitalWrite(PIN_LED_HEARTBEAT, heartbeatState ? HIGH : LOW);

        unsigned long uptimeSec = now / 1000;
        updateOLED(uptimeSec, heartbeatState);

        // Output health beacon over serial
        Serial.print(F("{\"type\":\"watchdog_heartbeat\",\"uptime_ms\":"));
        Serial.print(now);
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
            Serial.println(F("{\"event\": \"FAULT_INJECTED\", \"type\": \"DISCONNECT\"}"));
        } else if (cmd == "SIMULATE_FAULT_TAMPER") {
            simulatedFaultMode = "CHASSIS_TAMPER";
            Serial.println(F("{\"event\": \"FAULT_INJECTED\", \"type\": \"TAMPER\"}"));
        } else if (cmd == "CLEAR_FAULT") {
            simulatedFaultMode = "NONE";
            Serial.println(F("{\"event\": \"FAULT_CLEARED\"}"));
        } else if (cmd == "PING") {
            Serial.println(F("{\"pong\": true, \"laptop\": \"A\"}"));
        }
    }
}
