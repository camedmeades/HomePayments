/**
 * Field-level encryption for sensitive columns.
 *
 * Master key is a random 32-byte AES key generated on first launch and stored
 * in the OS credential store (Windows Credential Manager on Win, Keychain on
 * macOS). The DB file itself is unencrypted, but values written through
 * encryptField() are AES-256-GCM ciphertexts.
 *
 * Threat model: protects against casual exfiltration of the .db file from
 * a backup, USB stick, sync folder, etc. Does NOT protect against an
 * attacker with logged-in access to your Windows user account.
 */

import crypto from 'node:crypto';
import keytar from 'keytar';
import { log } from './logger.js';

const SERVICE = 'billcal';
const ACCOUNT = 'master-key-v1';
const ALG = 'aes-256-gcm';

let cachedKey: Buffer | null = null;
let available = false;

export async function initEncryption(): Promise<{ available: boolean }> {
  try {
    let b64 = await keytar.getPassword(SERVICE, ACCOUNT);
    if (!b64) {
      const fresh = crypto.randomBytes(32);
      b64 = fresh.toString('base64');
      await keytar.setPassword(SERVICE, ACCOUNT, b64);
      log.info('Generated new master encryption key in OS credential store');
    }
    cachedKey = Buffer.from(b64, 'base64');
    if (cachedKey.length !== 32) throw new Error('Master key is not 32 bytes');
    available = true;
    return { available };
  } catch (err) {
    // keytar can fail on Linux without libsecret, or in CI. We log and
    // continue without encryption rather than crash. Callers can check
    // isEncryptionAvailable() before writing sensitive data.
    log.warn('Encryption unavailable:', err);
    available = false;
    return { available };
  }
}

export function isEncryptionAvailable(): boolean {
  return available;
}

export function encryptField(plaintext: string): string {
  if (!cachedKey) throw new Error('Encryption not initialised');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, cachedKey, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // format: v1:base64(iv|tag|ciphertext)
  return 'v1:' + Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptField(ciphertext: string): string {
  if (!cachedKey) throw new Error('Encryption not initialised');
  if (!ciphertext.startsWith('v1:')) throw new Error('Unknown ciphertext format');
  const buf = Buffer.from(ciphertext.slice(3), 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALG, cachedKey, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}
