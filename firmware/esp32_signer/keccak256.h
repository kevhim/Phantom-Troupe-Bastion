#ifndef KECCAK256_H
#define KECCAK256_H

#include <Arduino.h>
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Computes standard Ethereum Keccak-256 hash.
 * Uses Keccak-f[1600] permutation, rate = 136 bytes, and 0x01 ... 0x80 padding.
 */
void keccak256(const uint8_t* in, size_t in_len, uint8_t out[32]);

#ifdef __cplusplus
}
#endif

#endif // KECCAK256_H
