#include "keccak256.h"
#include <string.h>

#define KECCAK_ROUNDS 24
#define KECCAK_RATE_BYTES 136

static const uint64_t keccak_rc[24] = {
    0x0000000000000001ULL, 0x0000000000008082ULL, 0x800000000000808AULL, 0x8000000080008000ULL,
    0x000000000000808BULL, 0x0000000080000001ULL, 0x8000000080008081ULL, 0x8000000000008009ULL,
    0x000000000000008AULL, 0x0000000000000088ULL, 0x0000000080008009ULL, 0x000000008000000AULL,
    0x000000008000808BULL, 0x800000000000008BULL, 0x8000000000008089ULL, 0x8000000000008003ULL,
    0x8000000000008002ULL, 0x8000000000000080ULL, 0x000000000000800AULL, 0x800000008000000AULL,
    0x8000000080008081ULL, 0x8000000000008080ULL, 0x0000000080000001ULL, 0x8000000080008008ULL
};

static const unsigned int keccak_rotc[24] = {
    1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14,
    27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44
};

static const unsigned int keccak_piln[24] = {
    10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4,
    15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1
};

#define ROL64(x, n) (((x) << (n)) | ((x) >> (64 - (n))))

static void keccak_f1600(uint64_t state[25]) {
    for (int round = 0; round < KECCAK_ROUNDS; round++) {
        // Theta step
        uint64_t C[5], D[5];
        for (int i = 0; i < 5; i++) {
            C[i] = state[i] ^ state[i + 5] ^ state[i + 10] ^ state[i + 15] ^ state[i + 20];
        }
        for (int i = 0; i < 5; i++) {
            D[i] = C[(i + 4) % 5] ^ ROL64(C[(i + 1) % 5], 1);
        }
        for (int i = 0; i < 25; i++) {
            state[i] ^= D[i % 5];
        }

        // Rho and Pi steps
        uint64_t current = state[1];
        for (int i = 0; i < 24; i++) {
            unsigned int j = keccak_piln[i];
            uint64_t temp = state[j];
            state[j] = ROL64(current, keccak_rotc[i]);
            current = temp;
        }

        // Chi step
        for (int j = 0; j < 25; j += 5) {
            uint64_t t[5];
            for (int i = 0; i < 5; i++) t[i] = state[j + i];
            for (int i = 0; i < 5; i++) {
                state[j + i] ^= (~t[(i + 1) % 5]) & t[(i + 2) % 5];
            }
        }

        // Iota step
        state[0] ^= keccak_rc[round];
    }
}

void keccak256(const uint8_t* in, size_t in_len, uint8_t out[32]) {
    uint64_t state[25] = {0};
    uint8_t* byte_state = (uint8_t*)state;
    size_t rate = KECCAK_RATE_BYTES;
    size_t block_pos = 0;

    for (size_t i = 0; i < in_len; i++) {
        byte_state[block_pos++] ^= in[i];
        if (block_pos == rate) {
            keccak_f1600(state);
            block_pos = 0;
        }
    }

    // Ethereum padding: 0x01 ... 0x80
    byte_state[block_pos] ^= 0x01;
    byte_state[rate - 1] ^= 0x80;
    keccak_f1600(state);

    memcpy(out, byte_state, 32);
}
