#include "crypto_utils.h"
#include "keccak256.h"
#include <uECC.h>
#include <mbedtls/bignum.h>
#include <string.h>
#include <ctype.h>

static const char* SECP256K1_N_HEX = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141";
static const char* SECP256K1_HALF_N_HEX = "7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0";

// Typehashes matching BastionAccount.sol
// keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
static const uint8_t EIP712_DOMAIN_TYPEHASH[32] = {
    0x8b, 0x73, 0xc3, 0xc6, 0x9b, 0xb8, 0xfe, 0x3d,
    0x51, 0x2e, 0xcc, 0x4c, 0xf7, 0x59, 0xcc, 0x79,
    0x23, 0x9f, 0x7b, 0x17, 0x9b, 0x0f, 0xfa, 0xca,
    0xa9, 0xa7, 0x5d, 0x52, 0x2b, 0x39, 0x40, 0x0f
};

// keccak256("PaymentIntent(uint256 chainId,address verifyingAccount,uint256 accountNonce,string requestId,uint256 policyVersion,string actorSession,string approvalTier,address tokenAddress,address targetContract,bytes4 functionSelector,address recipientAddress,uint256 amountBaseUnits,uint256 maxPerTxException,uint256 deadline,bytes32 calldataHash)")
static const uint8_t PAYMENT_INTENT_TYPEHASH[32] = {
    0x8e, 0xda, 0xb0, 0xf8, 0x9e, 0x50, 0x98, 0x57,
    0x27, 0x1a, 0x37, 0x91, 0x31, 0x3f, 0x6b, 0x36,
    0x84, 0x9a, 0x16, 0xa6, 0x99, 0x40, 0x22, 0xf9,
    0x12, 0x28, 0xb8, 0xb8, 0xe0, 0xf7, 0x16, 0x97
};

static int default_RNG(uint8_t *dest, unsigned size) {
    while (size--) {
        *dest++ = (uint8_t)esp_random();
    }
    return 1;
}

bool generate_device_key(uint8_t priv_key[32]) {
    uECC_set_rng(default_RNG);
    uint8_t public_key[64];
    return uECC_make_key(public_key, priv_key, uECC_secp256k1()) == 1;
}

void bytes_to_hex(const uint8_t* in, size_t in_len, char* out) {
    static const char hex_chars[] = "0123456789abcdef";
    for (size_t i = 0; i < in_len; i++) {
        out[i * 2]     = hex_chars[(in[i] >> 4) & 0x0F];
        out[i * 2 + 1] = hex_chars[in[i] & 0x0F];
    }
    out[in_len * 2] = '\0';
}

static uint8_t parse_hex_nibble(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return 0;
}

bool hex_to_bytes(const char* hex, uint8_t* out, size_t out_len) {
    if (hex == NULL) return false;
    if (hex[0] == '0' && (hex[1] == 'x' || hex[1] == 'X')) {
        hex += 2;
    }
    size_t hex_len = strlen(hex);
    if (hex_len != out_len * 2) return false;

    for (size_t i = 0; i < hex_len; ++i) {
        if (!isxdigit((unsigned char)hex[i])) return false;
    }
    for (size_t i = 0; i < out_len; i++) {
        out[i] = (parse_hex_nibble(hex[i * 2]) << 4) | parse_hex_nibble(hex[i * 2 + 1]);
    }
    return true;
}

bool derive_ethereum_address(const uint8_t priv_key[32], char addr_out[43]) {
    uECC_Curve curve = uECC_secp256k1();
    uint8_t pub[64];
    if (!uECC_compute_public_key(priv_key, pub, curve)) {
        return false;
    }
    uint8_t hash[32];
    keccak256(pub, 64, hash);

    addr_out[0] = '0';
    addr_out[1] = 'x';
    bytes_to_hex(hash + 12, 20, addr_out + 2);
    return true;
}

void compute_transfer_calldata_hash(const char* recipient_addr, uint64_t amount, uint8_t hash_out[32]) {
    uint8_t calldata[68];
    // Selector 0xa9059cbb
    calldata[0] = 0xa9;
    calldata[1] = 0x05;
    calldata[2] = 0x9c;
    calldata[3] = 0xbb;

    // Recipient: 12 bytes zeros + 20 bytes address
    memset(calldata + 4, 0, 12);
    hex_to_bytes(recipient_addr, calldata + 16, 20);

    // Amount: uint256 big-endian (top 24 bytes zero, lower 8 bytes uint64)
    memset(calldata + 36, 0, 24);
    for (int i = 0; i < 8; i++) {
        calldata[60 + i] = (uint8_t)((amount >> ((7 - i) * 8)) & 0xFF);
    }

    keccak256(calldata, 68, hash_out);
}

void compute_domain_separator(uint32_t chain_id, const char* verifying_contract, uint8_t domain_sep_out[32]) {
    uint8_t block[160];
    // Word 0: EIP712_DOMAIN_TYPEHASH
    memcpy(block, EIP712_DOMAIN_TYPEHASH, 32);

    // Word 1: keccak256("BastionX")
    keccak256((const uint8_t*)"BastionX", 8, block + 32);

    // Word 2: keccak256("2")
    keccak256((const uint8_t*)"2", 1, block + 64);

    // Word 3: chainId as uint256
    memset(block + 96, 0, 28);
    block[124] = (uint8_t)((chain_id >> 24) & 0xFF);
    block[125] = (uint8_t)((chain_id >> 16) & 0xFF);
    block[126] = (uint8_t)((chain_id >> 8) & 0xFF);
    block[127] = (uint8_t)(chain_id & 0xFF);

    // Word 4: verifyingContract address (12 zeros + 20 bytes)
    memset(block + 128, 0, 12);
    hex_to_bytes(verifying_contract, block + 140, 20);

    keccak256(block, 160, domain_sep_out);
}

void compute_struct_hash(const CanonicalPaymentIntent* intent, uint8_t struct_hash_out[32]) {
    uint8_t enc[512];
    memset(enc, 0, 512);

    // --- Part 1 (enc1: 8 words, 256 bytes) ---
    // Word 0: PAYMENT_INTENT_TYPEHASH
    memcpy(enc + 0, PAYMENT_INTENT_TYPEHASH, 32);

    // Word 1: chainId
    enc[60] = (uint8_t)((intent->chainId >> 24) & 0xFF);
    enc[61] = (uint8_t)((intent->chainId >> 16) & 0xFF);
    enc[62] = (uint8_t)((intent->chainId >> 8) & 0xFF);
    enc[63] = (uint8_t)(intent->chainId & 0xFF);

    // Word 2: verifyingAccount (address)
    hex_to_bytes(intent->verifyingAccount, enc + 64 + 12, 20);

    // Word 3: accountNonce
    enc[124] = (uint8_t)((intent->accountNonce >> 24) & 0xFF);
    enc[125] = (uint8_t)((intent->accountNonce >> 16) & 0xFF);
    enc[126] = (uint8_t)((intent->accountNonce >> 8) & 0xFF);
    enc[127] = (uint8_t)(intent->accountNonce & 0xFF);

    // Word 4: keccak256(requestId)
    keccak256((const uint8_t*)intent->requestId, strlen(intent->requestId), enc + 128);

    // Word 5: policyVersion
    enc[188] = (uint8_t)((intent->policyVersion >> 24) & 0xFF);
    enc[189] = (uint8_t)((intent->policyVersion >> 16) & 0xFF);
    enc[190] = (uint8_t)((intent->policyVersion >> 8) & 0xFF);
    enc[191] = (uint8_t)(intent->policyVersion & 0xFF);

    // Word 6: keccak256(actorSession)
    keccak256((const uint8_t*)intent->actorSession, strlen(intent->actorSession), enc + 192);

    // Word 7: keccak256(approvalTier)
    keccak256((const uint8_t*)intent->approvalTier, strlen(intent->approvalTier), enc + 224);

    // --- Part 2 (enc2: 8 words, 256 bytes) ---
    // Word 8: tokenAddress (address)
    hex_to_bytes(intent->tokenAddress, enc + 256 + 12, 20);

    // Word 9: targetContract (address)
    hex_to_bytes(intent->targetContract, enc + 288 + 12, 20);

    // Word 10: functionSelector (bytes4 left-aligned)
    hex_to_bytes(intent->functionSelector, enc + 320, 4);

    // Word 11: recipientAddress (address)
    hex_to_bytes(intent->recipientAddress, enc + 352 + 12, 20);

    // Word 12: amountBaseUnits (uint256)
    for (int i = 0; i < 8; i++) {
        enc[384 + 24 + i] = (uint8_t)((intent->amountBaseUnits >> ((7 - i) * 8)) & 0xFF);
    }

    // Word 13: maxPerTxException (uint256)
    for (int i = 0; i < 8; i++) {
        enc[416 + 24 + i] = (uint8_t)((intent->maxPerTxException >> ((7 - i) * 8)) & 0xFF);
    }

    // Word 14: deadline (uint256)
    enc[476] = (uint8_t)((intent->deadline >> 24) & 0xFF);
    enc[477] = (uint8_t)((intent->deadline >> 16) & 0xFF);
    enc[478] = (uint8_t)((intent->deadline >> 8) & 0xFF);
    enc[479] = (uint8_t)(intent->deadline & 0xFF);

    // Word 15: calldataHash (bytes32)
    hex_to_bytes(intent->calldataHash, enc + 480, 32);

    keccak256(enc, 512, struct_hash_out);
}

void compute_signing_digest(const CanonicalPaymentIntent* intent, uint8_t digest_out[32]) {
    uint8_t domain_separator[32];
    compute_domain_separator(intent->chainId, intent->verifyingAccount, domain_separator);

    uint8_t struct_hash[32];
    compute_struct_hash(intent, struct_hash);

    uint8_t final_pack[66];
    final_pack[0] = 0x19;
    final_pack[1] = 0x01;
    memcpy(final_pack + 2, domain_separator, 32);
    memcpy(final_pack + 34, struct_hash, 32);

    keccak256(final_pack, 66, digest_out);
}

bool sign_secp256k1_canonical(const uint8_t priv_key[32], const uint8_t digest[32], uint8_t sig_out[65]) {
    uECC_set_rng(&default_RNG);
    uECC_Curve curve = uECC_secp256k1();

    uint8_t raw_sig[64];
    if (!uECC_sign(priv_key, digest, 32, raw_sig, curve)) {
        return false;
    }

    uint8_t* r_bytes = raw_sig;
    uint8_t* s_bytes = raw_sig + 32;

    // Use mbedtls_mpi to recover k, determine recovery ID v, and enforce canonical low-s
    mbedtls_mpi N, half_N, d, h, r, s, s_inv, temp, k;
    mbedtls_mpi_init(&N);
    mbedtls_mpi_init(&half_N);
    mbedtls_mpi_init(&d);
    mbedtls_mpi_init(&h);
    mbedtls_mpi_init(&r);
    mbedtls_mpi_init(&s);
    mbedtls_mpi_init(&s_inv);
    mbedtls_mpi_init(&temp);
    mbedtls_mpi_init(&k);

    mbedtls_mpi_read_string(&N, 16, SECP256K1_N_HEX);
    mbedtls_mpi_read_string(&half_N, 16, SECP256K1_HALF_N_HEX);
    mbedtls_mpi_read_binary(&d, priv_key, 32);
    mbedtls_mpi_read_binary(&h, digest, 32);
    mbedtls_mpi_read_binary(&r, r_bytes, 32);
    mbedtls_mpi_read_binary(&s, s_bytes, 32);

    // s_inv = s^(-1) mod N
    mbedtls_mpi_inv_mod(&s_inv, &s, &N);

    // temp = (r * d) mod N
    mbedtls_mpi_mul_mpi(&temp, &r, &d);
    mbedtls_mpi_mod_mpi(&temp, &temp, &N);

    // temp = (h + r*d) mod N
    mbedtls_mpi_add_mpi(&temp, &h, &temp);
    mbedtls_mpi_mod_mpi(&temp, &temp, &N);

    // k = temp * s_inv mod N
    mbedtls_mpi_mul_mpi(&k, &temp, &s_inv);
    mbedtls_mpi_mod_mpi(&k, &k, &N);

    uint8_t k_bytes[32];
    mbedtls_mpi_write_binary(&k, k_bytes, 32);

    // Compute R = k * G
    uint8_t R_pub[64];
    uECC_compute_public_key(k_bytes, R_pub, curve);

    uint8_t Ry_parity = R_pub[63] & 1; // odd/even

    // Low-s canonicalization: if s > N/2, s = N - s and flip Ry_parity
    if (mbedtls_mpi_cmp_mpi(&s, &half_N) > 0) {
        mbedtls_mpi_sub_mpi(&s, &N, &s);
        Ry_parity ^= 1;
    }

    uint8_t v = 27 + Ry_parity;

    // Output 65 bytes: r (32) + s (32) + v (1)
    memcpy(sig_out, r_bytes, 32);
    mbedtls_mpi_write_binary(&s, sig_out + 32, 32);
    sig_out[64] = v;

    mbedtls_mpi_free(&N);
    mbedtls_mpi_free(&half_N);
    mbedtls_mpi_free(&d);
    mbedtls_mpi_free(&h);
    mbedtls_mpi_free(&r);
    mbedtls_mpi_free(&s);
    mbedtls_mpi_free(&s_inv);
    mbedtls_mpi_free(&temp);
    mbedtls_mpi_free(&k);

    return true;
}

// -------------------------------------------------------------
// RLP Serializer Helper for Raw Ethereum Transactions
// -------------------------------------------------------------
static size_t rlp_encode_bytes(const uint8_t* in, size_t len, uint8_t* out) {
    if (len == 1 && in[0] < 0x80) {
        out[0] = in[0];
        return 1;
    } else if (len <= 55) {
        out[0] = (uint8_t)(0x80 + len);
        memcpy(out + 1, in, len);
        return 1 + len;
    } else {
        uint8_t len_bytes[4];
        size_t l = len;
        int count = 0;
        while (l > 0) {
            len_bytes[count++] = (uint8_t)(l & 0xFF);
            l >>= 8;
        }
        out[0] = (uint8_t)(0xb7 + count);
        for (int i = 0; i < count; i++) {
            out[1 + i] = len_bytes[count - 1 - i];
        }
        memcpy(out + 1 + count, in, len);
        return 1 + count + len;
    }
}

static size_t rlp_encode_uint(uint64_t val, uint8_t* out) {
    if (val == 0) {
        out[0] = 0x80;
        return 1;
    }
    uint8_t buf[8];
    int count = 0;
    while (val > 0) {
        buf[count++] = (uint8_t)(val & 0xFF);
        val >>= 8;
    }
    uint8_t big_endian[8];
    for (int i = 0; i < count; i++) {
        big_endian[i] = buf[count - 1 - i];
    }
    return rlp_encode_bytes(big_endian, count, out);
}

static size_t rlp_wrap_list(const uint8_t* payload, size_t payload_len, uint8_t* out) {
    if (payload_len <= 55) {
        out[0] = (uint8_t)(0xc0 + payload_len);
        memcpy(out + 1, payload, payload_len);
        return 1 + payload_len;
    } else {
        uint8_t len_bytes[4];
        size_t l = payload_len;
        int count = 0;
        while (l > 0) {
            len_bytes[count++] = (uint8_t)(l & 0xFF);
            l >>= 8;
        }
        out[0] = (uint8_t)(0xf7 + count);
        for (int i = 0; i < count; i++) {
            out[1 + i] = len_bytes[count - 1 - i];
        }
        memcpy(out + 1 + count, payload, payload_len);
        return 1 + count + payload_len;
    }
}

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
) {
    if (strlen(reason) > 128) return false;
    // 1. Construct ABI Calldata for revokeSession(bytes32,string)
    // Selector 0x293e7049
    uint8_t calldata[256];
    calldata[0] = 0x29;
    calldata[1] = 0x3e;
    calldata[2] = 0x70;
    calldata[3] = 0x49;

    // Word 0: sessionId (bytes32)
    memcpy(calldata + 4, session_id, 32);

    // Word 1: offset to string = 64 (0x40)
    memset(calldata + 36, 0, 31);
    calldata[67] = 0x40;

    // Word 2: string length
    size_t reason_len = strlen(reason);
    memset(calldata + 68, 0, 31);
    calldata[99] = (uint8_t)reason_len;

    // Word 3: string bytes padded to 32 bytes
    size_t string_words = (reason_len + 31) / 32;
    size_t padded_str_len = string_words * 32;
    memset(calldata + 100, 0, padded_str_len);
    memcpy(calldata + 100, reason, reason_len);

    size_t calldata_len = 4 + 32 + 32 + 32 + padded_str_len;

    // 2. Build RLP for Signing Hash (EIP-155: [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0])
    uint8_t payload[512];
    size_t pos = 0;

    pos += rlp_encode_uint(nonce, payload + pos);
    pos += rlp_encode_uint(gas_price, payload + pos);
    pos += rlp_encode_uint(gas_limit, payload + pos);

    uint8_t to_addr[20];
    hex_to_bytes(target_contract, to_addr, 20);
    pos += rlp_encode_bytes(to_addr, 20, payload + pos);

    pos += rlp_encode_uint(0, payload + pos); // value = 0
    pos += rlp_encode_bytes(calldata, calldata_len, payload + pos);
    pos += rlp_encode_uint(chain_id, payload + pos);
    pos += rlp_encode_uint(0, payload + pos);
    pos += rlp_encode_uint(0, payload + pos);

    uint8_t tx_to_hash[600];
    size_t tx_to_hash_len = rlp_wrap_list(payload, pos, tx_to_hash);

    uint8_t tx_hash[32];
    keccak256(tx_to_hash, tx_to_hash_len, tx_hash);

    // 3. Sign Hash with Revoker Private Key
    uint8_t sig[65];
    if (!sign_secp256k1_canonical(revoker_priv, tx_hash, sig)) {
        return false;
    }

    uint8_t v_rec = sig[64]; // 27 or 28
    uint64_t v_eip155 = (uint64_t)chain_id * 2 + 35 + (v_rec - 27);

    // 4. Build Signed RLP ([nonce, gasPrice, gasLimit, to, value, data, v, r, s])
    pos = 0;
    pos += rlp_encode_uint(nonce, payload + pos);
    pos += rlp_encode_uint(gas_price, payload + pos);
    pos += rlp_encode_uint(gas_limit, payload + pos);
    pos += rlp_encode_bytes(to_addr, 20, payload + pos);
    pos += rlp_encode_uint(0, payload + pos);
    pos += rlp_encode_bytes(calldata, calldata_len, payload + pos);
    pos += rlp_encode_uint(v_eip155, payload + pos);
    // RLP integers must be minimally encoded (strip leading zero bytes).
    size_t r_start = 0, s_start = 32;
    while (r_start < 31 && sig[r_start] == 0) ++r_start;
    while (s_start < 63 && sig[s_start] == 0) ++s_start;
    pos += rlp_encode_bytes(sig + r_start, 32 - r_start, payload + pos);
    pos += rlp_encode_bytes(sig + s_start, 64 - s_start, payload + pos);

    uint8_t final_raw_tx[700];
    size_t final_len = rlp_wrap_list(payload, pos, final_raw_tx);

    if (final_len * 2 + 3 > max_out_len) {
        return false;
    }

    raw_tx_hex_out[0] = '0';
    raw_tx_hex_out[1] = 'x';
    bytes_to_hex(final_raw_tx, final_len, raw_tx_hex_out + 2);

    return true;
}
