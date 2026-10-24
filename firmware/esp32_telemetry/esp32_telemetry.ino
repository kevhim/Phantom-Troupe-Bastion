/**
 * BASTION X v2.2 — ESP32 #2 Operator Telemetry & Status Controller Firmware
 * Laptop A (RTX 5060) Host
 *
 * Hardware Wiring (Laptop A):
 * - SSD1306 OLED #2: SDA GPIO21, SCL GPIO22 (3.3V I2C, 0x3C)
 * - USB: Serial communication with Laptop A application backend (115200 baud)
 *
 * Security Invariants:
 * 1. Strictly unprivileged operator-side telemetry display.
 * 2. Possesses ZERO signing keys or financial credentials.
 * 3. Never produces or attempts to produce transaction signatures.
 */

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Operator Telemetry State
String agentStatus = "IDLE";
String securityState = "HEALTHY";
float spentTodayUSD = 0.0;
float dailyCapUSD = 100.0;
int txCount = 0;
String lastOrder = "None";
unsigned long lastUpdate = 0;

void renderScreen() {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);

    // Header
    display.setCursor(0, 0);
    display.print("[BASTION X OPERATOR]");

    display.setCursor(0, 14);
    display.print("Agent: ");
    display.print(agentStatus);

    display.setCursor(0, 26);
    display.print("SOC:   ");
    display.print(securityState);

    display.setCursor(0, 38);
    display.print("Daily: $");
    display.print(spentTodayUSD, 2);
    display.print("/$");
    display.print(dailyCapUSD, 0);

    display.setCursor(0, 50);
    display.print("TXs: ");
    display.print(txCount);
    display.print(" | ");
    display.print(lastOrder.substring(0, 8));

    display.display();
}

void parseSerialCommand(String line) {
    line.trim();
    if (line.length() == 0) return;

    // Simple key-value format or JSON:
    // STATUS:ACTIVE,SEC:HEALTHY,SPENT:45.0,CAP:100.0,TXS:3,ORD:ORD-9912
    if (line.startsWith("STATUS:")) {
        int idx1 = line.indexOf("STATUS:") + 7;
        int idx2 = line.indexOf(",SEC:");
        int idx3 = line.indexOf(",SPENT:");
        int idx4 = line.indexOf(",CAP:");
        int idx5 = line.indexOf(",TXS:");
        int idx6 = line.indexOf(",ORD:");

        if (idx2 > 0) agentStatus = line.substring(idx1, idx2);
        if (idx3 > 0) securityState = line.substring(idx2 + 5, idx3);
        if (idx4 > 0) spentTodayUSD = line.substring(idx3 + 7, idx4).toFloat();
        if (idx5 > 0) dailyCapUSD = line.substring(idx4 + 5, idx5).toFloat();
        if (idx6 > 0) txCount = line.substring(idx5 + 5, idx6).toInt();
        if (idx6 > 0) lastOrder = line.substring(idx6 + 5);

        lastUpdate = millis();
        renderScreen();
    }
}

void setup() {
    Serial.begin(115200);
    Wire.begin(21, 22);

    if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println(F("{\"error\": \"OLED #2 initialization failed\"}"));
    } else {
        display.clearDisplay();
        display.setTextSize(1);
        display.setTextColor(SSD1306_WHITE);
        display.setCursor(0, 20);
        display.println(F("BASTION X v2.2"));
        display.println(F("Operator Node"));
        display.println(F("Laptop A Online"));
        display.display();
        delay(1500);
        renderScreen();
    }
    Serial.println(F("{\"status\": \"READY\", \"node\": \"esp32_telemetry\", \"laptop\": \"A\"}"));
}

void loop() {
    if (Serial.available()) {
        String line = Serial.readStringUntil('\n');
        parseSerialCommand(line);
    }

    // Refresh display periodically
    if (millis() - lastUpdate > 3000) {
        renderScreen();
        lastUpdate = millis();
    }
}
