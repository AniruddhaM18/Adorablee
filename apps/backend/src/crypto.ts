import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
    const raw = process.env.ENCRYPTION_KEY;
    if (!raw) throw new Error("ENCRYPTION_KEY env var is missing");
    const buf = Buffer.from(raw, "hex");
    if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars)");
    return buf;
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns a string: `iv:authTag:ciphertext` (all hex-encoded).
 */
export function encrypt(plaintext: string): string {
    const key = getKey();
    const iv = randomBytes(12); // 96-bit IV is recommended for GCM
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a value produced by `encrypt()`.
 */
export function decrypt(ciphertext: string): string {
    const key = getKey();
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) throw new Error("Invalid ciphertext format");

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
