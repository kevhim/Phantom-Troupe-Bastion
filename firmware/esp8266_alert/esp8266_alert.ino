/**
 * [ARCHIVED IN v2.3] BASTION X — ESP8266 Wi-Fi Alarm & Buzzer Firmware
 * -----------------------------------------------------------------------------
 * ARCHIVE NOTICE (BASTION X v2.3):
 * The ESP8266 has been decommissioned as a required hardware dependency.
 * The 5V active buzzer is now connected directly to Arduino Uno #1 Pin D8 on
 * Laptop B (Intel Core Ultra 7 155H), driven locally by the Supervisor Service.
 * This file is preserved for reference and testing purposes only.
 * -----------------------------------------------------------------------------
 * Historical Topology:
 * - Physical Node Location: Powered by Laptop A (RTX 5060) via USB
 * - Security Domain: Responded to authenticated LAN alerts from Laptop B over Wi-Fi
 * - Active Buzzer: Signal on D1 (GPIO 5)
 * - Status LED: On-board LED on D4 (GPIO 2)
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

#define PIN_BUZZER 5 // D1
#define PIN_LED    2 // D4 (On-board LED, active LOW)

const char* ALERT_SECRET_HEADER = "X-Bastion-Alert-Secret";
const char* EXPECTED_ALERT_SECRET = "BASTION_SECURE_LAN_ALERT_KEY_2026";

ESP8266WebServer server(80);

void handleAlarm() {
    // Authenticate alert request origin
    if (server.hasHeader(ALERT_SECRET_HEADER)) {
        String token = server.header(ALERT_SECRET_HEADER);
        if (token != EXPECTED_ALERT_SECRET) {
            server.send(401, "application/json", "{\"error\":\"UNAUTHORIZED_ALERT\"}");
            return;
        }
    }

    // Trigger visual and auditory buzzer pulses
    digitalWrite(PIN_LED, LOW); // Active LOW on ESP8266
    for (int i = 0; i < 6; i++) {
        digitalWrite(PIN_BUZZER, HIGH);
        delay(120);
        digitalWrite(PIN_BUZZER, LOW);
        delay(80);
    }
    digitalWrite(PIN_LED, HIGH);

    server.send(200, "application/json", "{\"status\":\"ALARM_TRIGGERED\",\"node\":\"esp8266_alert\",\"laptop_power\":\"A\",\"auth_source\":\"B\"}");
}

void handleHealth() {
    server.send(200, "application/json", "{\"status\":\"HEALTHY\",\"node\":\"esp8266_alert\",\"role\":\"remote_buzzer\",\"power\":\"Laptop_A_USB\"}");
}

void setup() {
    Serial.begin(115200);
    pinMode(PIN_BUZZER, OUTPUT);
    pinMode(PIN_LED, OUTPUT);
    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_LED, HIGH);

    // Register endpoints
    const char *headerKeys[] = {ALERT_SECRET_HEADER};
    size_t headerKeysSize = sizeof(headerKeys) / sizeof(char*);
    server.collectHeaders(headerKeys, headerKeysSize);

    server.on("/alarm", HTTP_POST, handleAlarm);
    server.on("/health", HTTP_GET, handleHealth);
    server.begin();

    Serial.println(F("{\"status\": \"READY\", \"node\": \"esp8266_alert\", \"power_host\": \"Laptop_A\", \"alert_listener\": \"Port_80\"}"));
}

void loop() {
    server.handleClient();
}
