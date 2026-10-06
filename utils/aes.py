"""
aes.py — 纯 Python AES-128-ECB / PKCS7 实现 (等价 CryptoJS.AES ECB Pkcs7)
================================================================================
用于 nonce (key=AyrKJRXPO3nR5Abc) 与 pointJson (key=secretKey) 的加密。
无第三方依赖。输出经与 node crypto / 抓包真实 nonce 逐字符校验一致。
"""

import base64


class AES128ECB:
    _sbox = []
    _rcon = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36,
             0x6C, 0xD8, 0xAB, 0x4D]

    def __init__(self, key_bytes):
        if len(key_bytes) != 16:
            raise ValueError("AES-128 需要 16 字节密钥, 实际 %d" % len(key_bytes))
        if not AES128ECB._sbox:
            AES128ECB._build_sbox()
        self._round_keys = self._key_expansion(key_bytes)

    # ---- S-box 生成 ----
    @classmethod
    def _build_sbox(cls):
        p = 1
        q = 1
        sbox = [0] * 256
        sbox[0] = 0x63
        while True:
            # p = p * 3
            p = p ^ ((p << 1) & 0xFF) ^ (0x1B if p & 0x80 else 0)
            p &= 0xFF
            # q = q / 3 (即乘以 3 的逆)
            q ^= (q << 1) & 0xFF
            q ^= (q << 2) & 0xFF
            q ^= (q << 4) & 0xFF
            q ^= 0x09 if q & 0x80 else 0
            q &= 0xFF
            xformed = q ^ ((q << 1) | (q >> 7)) ^ ((q << 2) | (q >> 6)) \
                ^ ((q << 3) | (q >> 5)) ^ ((q << 4) | (q >> 4))
            sbox[p] = (xformed ^ 0x63) & 0xFF
            if p == 1:
                break
        cls._sbox = sbox

    @staticmethod
    def _xtime(a):
        a <<= 1
        if a & 0x100:
            a ^= 0x11B
        return a & 0xFF

    def _key_expansion(self, key):
        sbox = self._sbox
        key_symbols = list(key)
        words = [key_symbols[4 * i:4 * i + 4] for i in range(4)]
        for i in range(4, 44):
            temp = list(words[i - 1])
            if i % 4 == 0:
                temp = temp[1:] + temp[:1]            # RotWord
                temp = [sbox[b] for b in temp]         # SubWord
                temp[0] ^= self._rcon[i // 4 - 1]
            words.append([words[i - 4][j] ^ temp[j] for j in range(4)])
        round_keys = []
        for r in range(11):
            rk = []
            for c in range(4):
                rk.extend(words[r * 4 + c])
            round_keys.append(rk)
        return round_keys

    def _add_round_key(self, state, rk):
        for c in range(4):
            for r in range(4):
                state[r][c] ^= rk[c * 4 + r]

    def _sub_bytes(self, state):
        for r in range(4):
            for c in range(4):
                state[r][c] = self._sbox[state[r][c]]

    def _shift_rows(self, state):
        for r in range(1, 4):
            state[r] = state[r][r:] + state[r][:r]

    def _mix_columns(self, state):
        for c in range(4):
            a = [state[r][c] for r in range(4)]
            state[0][c] = self._xtime(a[0]) ^ (self._xtime(a[1]) ^ a[1]) ^ a[2] ^ a[3]
            state[1][c] = a[0] ^ self._xtime(a[1]) ^ (self._xtime(a[2]) ^ a[2]) ^ a[3]
            state[2][c] = a[0] ^ a[1] ^ self._xtime(a[2]) ^ (self._xtime(a[3]) ^ a[3])
            state[3][c] = (self._xtime(a[0]) ^ a[0]) ^ a[1] ^ a[2] ^ self._xtime(a[3])

    def _encrypt_block(self, block16):
        state = [[block16[r + 4 * c] for c in range(4)] for r in range(4)]
        self._add_round_key(state, self._round_keys[0])
        for rnd in range(1, 10):
            self._sub_bytes(state)
            self._shift_rows(state)
            self._mix_columns(state)
            self._add_round_key(state, self._round_keys[rnd])
        self._sub_bytes(state)
        self._shift_rows(state)
        self._add_round_key(state, self._round_keys[10])
        return bytes(state[r][c] for c in range(4) for r in range(4))

    def encrypt(self, data_bytes):
        pad = 16 - (len(data_bytes) % 16)          # PKCS7
        data = data_bytes + bytes([pad] * pad)
        out = bytearray()
        for i in range(0, len(data), 16):
            out += self._encrypt_block(data[i:i + 16])
        return bytes(out)


def aes_ecb_b64(plain_text, key_str):
    """AES-128-ECB + PKCS7 加密 -> Base64 字符串 (等价 CryptoJS)"""
    cipher = AES128ECB(key_str.encode("utf-8"))
    enc = cipher.encrypt(plain_text.encode("utf-8"))
    return base64.b64encode(enc).decode("ascii")


if __name__ == "__main__":
    # 自测: 与 node crypto / 抓包真实 nonce 对比
    print("P1", aes_ecb_b64('{"x":100,"y":50}', "sxdDe12ZrRcQ9qMv"))
    print("P2", aes_ecb_b64("36712762:1785402089000:2026/07/31:1:3:2", "AyrKJRXPO3nR5Abc"))
