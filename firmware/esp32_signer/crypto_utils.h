#ifndef CRYPTO_UTILS_H
#define CRYPTO_UTILS_H

#include <Arduino.h>
#include <stdint.h>
#include <stddef.h>

struct CanonicalPaymentIntent {
    uint32_t chainId;
    char verifyingAccount[43];
    uint32_t accountNonce;
    char requestId[96];
    uint32_t policyVersion;
    char actorSession[43];
    char approvalTier[24];
    char tokenAddress[43];
    char targetContract[43];
    char functionSelector[11];
    char recipientAddress[43];
    uint64_t amountBaseUnits;
    uint64_t maxPerTxException;
    uint32_t deadline;
    char calldataHash[67];
    char shortFingerprint[11];
};

#ifdef __cplusplus
extern "C" {
#endif

// Hex conversion utilities
void bytes_to_hex(const uint8_t* in, size_t in_len, char* out);
bool hex_to_bytes(const char* hex, uint8_t* out, size_t out_len);

// Generate a fresh device key using the ESP32 hardware RNG; never export it.
bool generate_device_key(uint8_t priv_key[32]);

// Address derivation
bool derive_ethereum_address(const uint8_t priv_key[32], char addr_out[43]);

// Calldata hash computation: keccak256(transfer(address,uint256))
void compute_transfer_calldata_hash(const char* recipient_addr, uint64_t amount, uint8_t hash_out[32]);

// EIP-712 Domain and Struct Hashing
void compute_domain_separator(uint32_t chain_id, const char* verifying_contract, uint8_t domain_sep_out[32]);
void compute_struct_hash(const CanonicalPaymentIntent* intent, uint8_t struct_hash_out[32]);
void compute_signing_digest(const CanonicalPaymentIntent* intent, uint8_t digest_out[32]);

// ECDSA SECP256K1 Signing (Canonical Low-s, 65 bytes: r[32] + s[32] + v[1])
bool sign_secp256k1_canonical(const uint8_t priv_key[32], const uint8_t digest[32], uint8_t sig_out[65]);

// Raw Ethereum Revocation Transaction Construction & Signing
bool build_and_sign_revocation_tx(
    uint32_t chain_id,
    uint64_t nonce,
    uint64_t gas_price,
    uint64_t gas_limit,
    const char* target_contract,
    const uint8_t revoker_priv[32],
    const uint8_t session_id[32],
    const char* reason,
    char* raw_tx_hex_out,
    size_t max_out_len
);

#ifdef __cplusplus
}
#endif

#endif // CRYPTO_UTILS_H
