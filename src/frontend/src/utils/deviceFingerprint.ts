/**
 * Generates a stable device fingerprint that persists across sessions.
 * Combines browser/device characteristics with a persisted UUID.
 */

const FINGERPRINT_KEY = 'eduboard_device_fp';

function generateCanvasHash(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('EduBoard🎓', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('EduBoard🎓', 4, 17);
    return canvas.toDataURL().slice(-32);
  } catch {
    return 'canvas-error';
  }
}

function generatePersistentUUID(): string {
  const stored = localStorage.getItem(FINGERPRINT_KEY + '_uuid');
  if (stored) return stored;
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  localStorage.setItem(FINGERPRINT_KEY + '_uuid', uuid);
  return uuid;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function getDeviceFingerprint(): string {
  const cached = localStorage.getItem(FINGERPRINT_KEY);
  if (cached) return cached;

  const components = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() ?? 'unknown',
    generateCanvasHash(),
    generatePersistentUUID(),
  ];

  const fingerprint = hashString(components.join('|')) + '-' + generatePersistentUUID().slice(0, 8);
  localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  return fingerprint;
}
