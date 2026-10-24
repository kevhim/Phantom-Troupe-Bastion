/**
 * BASTION X v2.2 — Arduino Uno #2 Auxiliary Watchdog & Fault Generator Firmware
 * Laptop A (RTX 5060) Host
 *
 * Hardware Wiring (Laptop A):
 * - USB Serial: Connects to Laptop A (9600 baud)
 * - LED Indicator: Pin 13 (Heartbeat LED)
 *
 * Security Invariants:
 * 1. Auxiliary diagnostic and fault-simulation node ONLY.
 * 2. Strictly FORBIDDEN from issuing financial approvals.
 * 3. The ERC-4337 smart wallet must NEVER trust Uno #2 as an authorization source.
 */

#define PIN_LED_HEARTBEAT 13

unsigned long lastHeartbeat = 0;
bool heartbeatState = false;
unsigned long faultSimTimer = 0;
String simulatedFaultMode = "NONE";

void setup() {
    Serial.begin(9600);
    pinMode(PIN_LED_HEARTBEAT, OUTPUT);
    digitalWrite(PIN_LED_HEARTBEAT, LOW);

    Serial.println(F("{\"status\": \"READY\", \"node\": \"uno_watchdog\", \"laptop\": \"A\", \"firmware\": \"v2.2\"}"));
}

void loop() {
    unsigned long now = millis();

    // 1. Periodic Heartbeat Blink
    if (now - lastHeartbeat >= 1000) {
        lastHeartbeat = now;
        heartbeatState = !heartbeatState;
        digitalWrite(PIN_LED_HEARTBEAT, heartbeatState ? HIGH : LOW);

        // Output health beacon
        Serial.print(F("{\"type\":\"watchdog_heartbeat\",\"uptime_ms\":"));
        Serial.print(now);
        Serial.print(F(",\"simulated_fault\":\""));
        Serial.print(simulatedFaultMode);
        Serial.println(F("\"}"));
    }

    // 2. Process incoming commands from Laptop A test suite
    if (Serial.available()) {
        String cmd = Serial.readStringUntil('\n');
        cmd.trim();

        if (cmd == "SIMULATE_FAULT_DISCONNECT") {
            simulatedFaultMode = "CABLE_DISCONNECT";
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
