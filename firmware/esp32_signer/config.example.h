// Signer keys are generated on device and stored in NVS. No private keys belong here.
// Copy to ignored config.h on Laptop B. Empty credentials intentionally fail closed.
// Public addresses are historical fixtures; replace ALL with fresh deployment/provisioning.
#ifndef BASTION_CONFIG_H
#define BASTION_CONFIG_H

#include <Arduino.h>

// -------------------------------------------------------------
// Hardware Pin Map (BASTION X v2.3 Single ESP32 on Laptop B)
// -------------------------------------------------------------
// RC522 RFID SPI
#define PIN_RC522_SCK   18
#define PIN_RC522_MISO  19
#define PIN_RC522_MOSI  23
#define PIN_RC522_SS    5
#define PIN_RC522_RST   27

// Dual OLED I2C (Shared Bus: SDA GPIO21, SCL GPIO22)
#define PIN_I2C_SDA     21
#define PIN_I2C_SCL     22
#define OLED1_I2C_ADDR  0x3C // Mandatory Trusted Review Screen (Fail-Closed)
#define OLED2_I2C_ADDR  0x3D // Auxiliary Status & Telemetry Screen (Non-blocking)

#define SCREEN_WIDTH    128
#define SCREEN_HEIGHT   64

// Physical Push Buttons (INPUT_PULLUP)
#define PIN_BUTTON_PANIC    32 // Instant interrupt
#define PIN_BUTTON_APPROVE  33 // Requires sustained press >= 1.5s

// -------------------------------------------------------------
// Authorized RFID Role Cards & Role Ceilings
// -------------------------------------------------------------
#define RFID_CARD_JUNIOR_UID  "A1B2C3D4"
#define RFID_CARD_SENIOR_UID  "E5F6G7H8"

#define JUNIOR_ROLE_CAP_RAW   2000000000ULL // 2,000 bUSD (6 decimals)
#define SENIOR_ROLE_CAP_RAW  10000000000ULL // 10,000 bUSD (6 decimals)

// -------------------------------------------------------------
// Contract Addresses & Roles (Chain ID 31337)
// -------------------------------------------------------------
#define AGENT_SESSION_ADDRESS "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
#define DEFAULT_CHAIN_ID         31337
#define BASTION_ACCOUNT_ADDR     "0x0165878A594ca255338adfa4d48449f69242Eb8F"
#define MOCK_TOKEN_ADDR          "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
#define ALLOWED_VENDOR_ADDR      "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
#define EXPECTED_SELECTOR        "0xa9059cbb"

// Junior Exception Signer (Anvil Account #2)

// Senior Exception Signer (Anvil Account #3)

// Emergency Revocation Signer (Anvil Account #4 / Revoker Role)

// Supervisor Authorized Recovery Secret Token
#define SUPERVISOR_RECOVERY_KEY  ""

// Wi-Fi and Direct RPC Network Configuration (Laptop B Anvil Node)
#define WIFI_SSID_DEFAULT        ""
#define WIFI_PASS_DEFAULT        ""
#define DIRECT_RPC_URL_DEFAULT   "http://192.168.1.100:8545"

#endif // BASTION_CONFIG_H
