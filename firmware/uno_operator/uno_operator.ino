/**
 * BASTION X v2.2 — Arduino Uno #1 Environmental Sensor & Status Node Firmware
 * Host Machine: Laptop B (Intel Core Ultra 7 155H) via USB Serial (9600 baud)
 *
 * Hardware Wiring (Laptop B):
 * - PIR Motion Sensor: D2
 * - DHT11 Temp/Humidity: D4
 * - 16x2 I2C LCD: A4 (SDA), A5 (SCL), I2C address 0x27 or 0x3F
 * - Optional SG90 Servo: D6 (PWM)
 *
 * Security Invariants:
 * 1. Environmental monitoring node only.
 * 2. Possesses ZERO financial signing authority.
 * 3. Never produces or is accepted as an authorization source for the ERC-4337 wallet.
 */

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define PIN_PIR   2
#define PIN_DHT   4
#define PIN_SERVO 6

LiquidCrystal_I2C lcd(0x27, 16, 2);

unsigned long lastSensorRead = 0;
bool lcdAvailable = false;

void setup() {
    Serial.begin(9600);
    pinMode(PIN_PIR, INPUT);
    pinMode(PIN_DHT, INPUT);

    Wire.begin();
    // Test if LCD responds
    Wire.beginTransmission(0x27);
    if (Wire.endTransmission() == 0) {
        lcd.init();
        lcd.backlight();
        lcd.setCursor(0, 0);
        lcd.print(F("BASTION B-STATUS"));
        lcd.setCursor(0, 1);
        lcd.print(F("Signer: READY   "));
        lcdAvailable = true;
    }

    Serial.println(F("{\"status\": \"READY\", \"node\": \"uno_sensors\", \"laptop\": \"B\", \"firmware\": \"v2.2\"}"));
}

void loop() {
    unsigned long now = millis();

    // Check PIR motion sensor
    int motion = digitalRead(PIN_PIR);
    if (motion == HIGH) {
        Serial.println(F("{\"event\":\"motion_detected\",\"source\":\"PIR_D2\",\"laptop\":\"B\"}"));
        if (lcdAvailable) {
            lcd.setCursor(0, 1);
            lcd.print(F("MOTION OBSERVED "));
        }
        delay(200);
    }

    // Periodic status reporting
    if (now - lastSensorRead >= 2000) {
        lastSensorRead = now;
        Serial.print(F("{\"type\":\"sensor_telemetry\",\"pir\":"));
        Serial.print(motion);
        Serial.println(F(",\"laptop\":\"B\"}"));
    }
}
