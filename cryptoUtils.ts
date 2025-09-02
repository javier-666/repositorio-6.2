import { EncryptedDataPayload, EntityExportData } from './types';

// Helper to convert buffer to base64
const bufferToBase64 = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

// Helper to convert base64 to buffer
const base64ToBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// Derives a key from a password using PBKDF2
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

// Encrypts data with a password
export const encryptData = async (data: object, password: string): Promise<string> => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));

    const encryptedContent = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encodedData
    );

    const payload: EncryptedDataPayload = {
        salt: bufferToBase64(salt.buffer),
        iv: bufferToBase64(iv.buffer),
        data: bufferToBase64(encryptedContent),
    };

    return JSON.stringify(payload);
};

// Decrypts data with a password
export const decryptData = async <T>(encryptedPayloadJSON: string, password: string): Promise<T> => {
    const payload: EncryptedDataPayload = JSON.parse(encryptedPayloadJSON);
    const salt = base64ToBuffer(payload.salt);
    const iv = base64ToBuffer(payload.iv);
    const encryptedData = base64ToBuffer(payload.data);

    const key = await deriveKey(password, new Uint8Array(salt));

    const decryptedContent = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedData
    );

    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(new Uint8Array(decryptedContent));
    return JSON.parse(decryptedString) as T;
};
