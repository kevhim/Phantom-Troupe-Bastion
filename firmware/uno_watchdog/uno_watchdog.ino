/**
 * BASTION X v2.3 — High-Tech OLED Dashboard for Arduino Uno
 * Host: Laptop A (NVIDIA RTX 5060)
 *
 * Wiring (4 Pins):
 * - GND      --> Arduino GND
 * - VDD/VCC  --> Arduino 5V (or 3.3V)
 * - SCK/SCL  --> Arduino Pin A5
 * - SDA      --> Arduino Pin A4
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDR 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

int animStep = 0;
unsigned long lastUpdate = 0;
int uptimeSec = 0;

void drawBastionDisplay() {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // 1. Sleek Outer Border Box
    display.drawRoundRect(0, 0, 128, 64, 4, SSD1306_WHITE);

    // 2. Bold Brand Header: BASTION X
    display.setTextSize(2);
    display.setCursor(11, 6);
    display.print(F("BASTION X"));

    // 3. Horizontal Separator Bar
    display.drawFastHLine(4, 25, 120, SSD1306_WHITE);

    // 4. Subtitle & Mode
    display.setTextSize(1);
    display.setCursor(8, 30);
    display.print(F("AI WALLET DEFENSE"));

    // 5. System Status & Node
    display.setCursor(8, 41);
    display.print(F("SYS: ONLINE [5060]"));

    // 6. Dynamic Moving Radar Bar at Bottom
    int barWidth = (uptimeSec % 16) * 7;
    if (barWidth > 112) barWidth = 112;
    display.drawRect(7, 52, 114, 6, SSD1306_WHITE);
    display.fillRect(8, 53, barWidth, 4, SSD1306_WHITE);

    display.display();
}

void setup() {
    Serial.begin(9600);
    pinMode(13, OUTPUT);

    // Initialize I2C OLED display at 0x3C
    Wire.begin();
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
        Serial.println(F("SSD1306 Allocation Failed!"));
        for(;;); // Halt if not found
    }

    Serial.println(F("SSD1306 Initialized Successfully!"));
    drawBastionDisplay();
}

void loop() {
    unsigned long now = millis();

    // Refresh animation and heartbeat every second
    if (now - lastUpdate >= 1000) {
        lastUpdate = now;
        uptimeSec++;

        // Blink Pin 13 LED
        digitalWrite(13, (uptimeSec % 2 == 0) ? HIGH : LOW);

        // Update OLED screen
        drawBastionDisplay();

        // Send telemetry beacon to Laptop A backend
        Serial.print(F("{\"node\":\"uno_watchdog\",\"status\":\"ONLINE\",\"uptime\":"));
        Serial.print(uptimeSec);
        Serial.println(F("}"));
    }
}
