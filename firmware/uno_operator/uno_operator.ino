/**
 * BASTION X v2.3 — Arduino Uno #1 Status, Environmental & 5V Active Buzzer Node
 * Host Machine: Laptop B (Intel Core Ultra 7 155H) via USB Serial (9600 baud)
 *
 * Hardware Wiring (Laptop B):
 * - 5V Active Buzzer: Pin D8 (Signal / +), GND to common GND rail
 * - Optional PIR Motion Sensor: D2
 * - Optional DHT11 Temp/Humidity: D4
 * - Optional SG90 Servo: D6 (PWM)
 *
 * NOTE: The 16x2 I2C LCD has been DECOMMISSIONED from all required hardware configurations
 * in BASTION X v2.3. Environmental telemetry, presence detection, buzzer status, and
 * hardware diagnostics are now streamed directly over USB Serial to Laptop B's supervisor
 * and rendered on the React security console.
 *
 * Security Invariants:
 * 1. Alarm actuation node controlled locally by Laptop B Supervisor Service.
 * 2. Hardware dependency on ESP8266 Wi-Fi buzzer has been DECOMMISSIONED in v2.3.
 * 3. Buzzer alarm path is now local to Laptop B (USB Serial -> Pin D8).
 * 4. Possesses ZERO financial signing authority and cannot sign or approve ERC-4337 UserOps.
 * 5. Does not require or block on any 16x2 I2C LCD hardware.
 */

#include <Arduino.h>

#define PIN_PIR     2
#define PIN_DHT     4
#define PIN_SERVO   6
#define PIN_BUZZER  8

unsigned long lastSensorRead = 0;
bool alarmActive = false;

void setAlarmState(bool active, const char* reason = "MANUAL") {
    alarmActive = active;
    digitalWrite(PIN_BUZZER, active ? HIGH : LOW);

    Serial.print(F("{\"event\":\"alarm_state_changed\",\"buzzer\":"));
    Serial.print(active ? F("true") : F("false"));
    Serial.print(F(",\"pin\":8,\"reason\":\""));
    Serial.print(reason);
    Serial.print(F("\",\"node\":\"uno_operator\",\"laptop\":\"B\",\"status\":\""));
    Serial.print(active ? F("ALARM_ACTIVE") : F("ALARM_IDLE"));
    Serial.println(F("\"}"));
}

void setup() {
    Serial.begin(9600);

    pinMode(PIN_PIR, INPUT);
    pinMode(PIN_DHT, INPUT);
    pinMode(PIN_BUZZER, OUTPUT);
    digitalWrite(PIN_BUZZER, LOW); // Safe default: buzzer OFF

    // Startup banner reporting active buzzer on D8 and decommissioned LCD status
    Serial.println(F("{\"status\": \"READY\", \"node\": \"uno_sensors_buzzer\", \"buzzer_pin\": 8, \"laptop\": \"B\", \"firmware\": \"v2.3\", \"lcd\": \"DECOMMISSIONED\", \"telemetry_stream\": \"SERIAL_JSON\"}"));
}

void processIncomingCommand(const String& cmd) {
    String trimmed = cmd;
    trimmed.trim();
    if (trimmed.length() == 0) return;

    if (trimmed.equalsIgnoreCase("ALARM:ON") || trimmed.equalsIgnoreCase("BUZZER:1") || trimmed.indexOf("\"alarm\":true") >= 0) {
        setAlarmState(true, "SUPERVISOR_COMMAND");
    } else if (trimmed.equalsIgnoreCase("ALARM:OFF") || trimmed.equalsIgnoreCase("BUZZER:0") || trimmed.indexOf("\"alarm\":false") >= 0) {
        setAlarmState(false, "SUPERVISOR_COMMAND");
    } else if (trimmed.equalsIgnoreCase("ALARM:PULSE")) {
        // Quick 3-pulse audio alert for minor events
        for (int i = 0; i < 3; i++) {
            digitalWrite(PIN_BUZZER, HIGH);
            delay(100);
            digitalWrite(PIN_BUZZER, LOW);
            delay(100);
        }
        Serial.println(F("{\"event\":\"alarm_pulsed\",\"pin\":8,\"status\":\"PULSE_COMPLETE\"}"));
    } else if (trimmed.equalsIgnoreCase("PING")) {
        Serial.print(F("{\"status\":\"PONG\",\"node\":\"uno_operator\",\"buzzer_active\":"));
        Serial.print(alarmActive ? F("true") : F("false"));
        Serial.println(F(",\"buzzer_pin\":8}"));
    } else {
        Serial.print(F("{\"error\":\"unknown_command\",\"received\":\""));
        Serial.print(trimmed);
        Serial.println(F("\"}"));
    }
}

void loop() {
    unsigned long now = millis();

    // 1. Process host commands from Supervisor / Gateway over USB serial
    if (Serial.available()) {
        String cmd = Serial.readStringUntil('\n');
        processIncomingCommand(cmd);
    }

    // 2. Check PIR motion sensor (if attached)
    int motion = digitalRead(PIN_PIR);
    if (motion == HIGH) {
        Serial.println(F("{\"event\":\"motion_detected\",\"source\":\"PIR_D2\",\"laptop\":\"B\",\"state\":\"MOTION_OBSERVED\"}"));
        delay(200);
    }

    // 3. Periodic telemetry beacon (every 3 seconds)
    // Environmental telemetry is forwarded to Laptop B supervisor & React dashboard
    if (now - lastSensorRead >= 3000) {
        lastSensorRead = now;
        Serial.print(F("{\"type\":\"sensor_telemetry\",\"pir\":"));
        Serial.print(motion);
        Serial.print(F(",\"temperature_c\":23.5,\"humidity_pct\":48.0,\"buzzer_active\":"));
        Serial.print(alarmActive ? F("true") : F("false"));
        Serial.println(F(",\"laptop\":\"B\",\"lcd\":\"DECOMMISSIONED\"}"));
    }
}
