/**
 * BASTION X — Simple Test: Display "HI" on OLED
 * Host: Laptop A (NVIDIA RTX 5060)
 *
 * Wiring (4 Pins to Arduino Uno):
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

void setup() {
    Serial.begin(9600);
    pinMode(13, OUTPUT);
    digitalWrite(13, HIGH);

    // 1. Initialize I2C communication and OLED display
    Wire.begin();
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
        Serial.println(F("OLED init failed! Check A4/A5 wiring."));
        for (;;);
    }

    // 2. Clear previous screen contents
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // 3. Draw a sleek outer border box
    display.drawRoundRect(0, 0, 128, 64, 4, SSD1306_WHITE);

    // 4. Print giant "HI" centered (Size 4 = 24x32 pixels per letter)
    display.setTextSize(4);
    display.setCursor(42, 10);
    display.print(F("HI"));

    // 5. Print "BASTION X" centered underneath
    display.setTextSize(1);
    display.setCursor(35, 48);
    display.print(F("BASTION X"));

    // 6. Push buffer to physical OLED screen
    display.display();

    Serial.println(F("Displaying 'HI' on OLED successfully!"));
}

void loop() {
    // Pulse built-in Pin 13 LED as heartbeat
    digitalWrite(13, HIGH);
    delay(500);
    digitalWrite(13, LOW);
    delay(500);
}
