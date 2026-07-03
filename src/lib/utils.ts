import LZString from 'lz-string';
import type { ThemeKey } from '../types';

/**
 * Encodes a Letter object safely into a URL-friendly Base64 string.
 * Uses LZString compression with v2 format header.
 */
export function encodeLetter(letter: {
  title: string;
  recipient: string;
  sender: string;
  body: string;
  theme: string;
}): string {
  try {
    const themeMap: Record<string, string> = {
      romantic: 'r', grateful: 'g', apology: 'a',
      birthday: 'c', friendship: 'f', simple: 's',
    };
    const themeCode = themeMap[letter.theme] || letter.theme;

    const data = [
      themeCode,
      letter.recipient || '',
      letter.sender || '',
      letter.title || '',
      letter.body || '',
    ].join('');

    const compressed = LZString.compressToEncodedURIComponent(data);
    return 'v2_' + compressed;
  } catch {
    return '';
  }
}

/**
 * Decodes a URL-friendly Base64 string back into a Letter object.
 * Supports v2 LZ-compressed, delimited, and legacy JSON formats.
 */
export function decodeLetter(base64: string): {
  title: string;
  recipient: string;
  sender: string;
  body: string;
  theme: ThemeKey;
} | null {
  try {
    if (!base64) return null;

    let clean = base64.trim();
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    const qi = clean.indexOf('?');
    if (qi !== -1) clean = clean.substring(0, qi);
    const hi = clean.indexOf('#');
    if (hi !== -1) clean = clean.substring(0, hi);

    let decoded = '';

    if (clean.startsWith('v2_')) {
      const sanitized = decodeURIComponent(clean.slice(3)).replace(/ /g, '+');
      const decompressed = LZString.decompressFromEncodedURIComponent(sanitized);
      if (!decompressed) return null;
      decoded = decompressed;
    } else {
      const sanitized = decodeURIComponent(clean).replace(/ /g, '+');
      decoded = decodeURIComponent(escape(atob(sanitized)));
    }

    if (decoded.startsWith('{')) {
      return JSON.parse(decoded);
    }

    const parts = decoded.split('');
    if (parts.length >= 5) {
      const [themeCode, recipient, sender, title, body] = parts;
      const themeReverse: Record<string, ThemeKey> = {
        r: 'romantic', g: 'grateful', a: 'apology',
        c: 'birthday', f: 'friendship', s: 'simple',
      };
      const theme = themeReverse[themeCode] ||
        (['romantic', 'grateful', 'apology', 'birthday', 'friendship', 'simple'].includes(themeCode)
          ? themeCode as ThemeKey : 'romantic');

      return { theme, recipient, sender, title, body };
    }

    return null;
  } catch {
    return null;
  }
}

export function runSelfTest(): boolean {
  try {
    const testData = {
      title: 'Test Love Letter',
      recipient: 'Aria',
      sender: 'Leo',
      body: 'I love you to the moon and back! ❤️ ✨',
      theme: 'romantic' as const,
    };
    const encoded = encodeLetter(testData);
    const decoded = decodeLetter(encoded);
    return !!(decoded && decoded.title === testData.title &&
      decoded.recipient === testData.recipient &&
      decoded.sender === testData.sender &&
      decoded.body === testData.body &&
      decoded.theme === testData.theme);
  } catch {
    return false;
  }
}

// Writing prompt templates for quick inspiration
export const TEMPLATES = [
  {
    name: '❤️ Romantic Whisper',
    title: 'To the one who holds my heart',
    theme: 'romantic' as const,
    recipient: 'My Beloved',
    sender: 'Yours Forever',
    body: `I wanted to write you something that words can barely carry. From the moment you walked into my life, everything took on a softer, brighter color. I love the quiet moments we share—the way you look when you laugh, the warmth of your hand in mine, and the silent understanding between us.\n\nYou are my home and my greatest adventure. No matter where life takes us, my heart will always wander back to you. Thank you for being you, beautifully and completely.`,
  },
  {
    name: '✨ Warm Gratitude',
    title: 'A note of quiet appreciation',
    theme: 'grateful' as const,
    recipient: 'My Lifeline',
    sender: 'With Deep Thanks',
    body: `There are times in life when everything feels heavy, and then there are people who make that weight vanish just by existing. You are that person for me.\n\nThank you for listening when I didn't have the words, for standing by me when things got complicated, and for believing in me even when I couldn't see my own strength. This is just a simple letter to say that I see everything you do, and I am endlessly grateful for your presence in my life.`,
  },
  {
    name: '🌿 Sincere Apology',
    title: 'From the bottom of my heart',
    theme: 'apology' as const,
    recipient: 'Dear Friend',
    sender: 'With Regret and Love',
    body: `I've been thinking a lot about what happened, and I want to apologize. My intention was never to hurt you, but I know that intentions don't excuse the outcome. You deserve my best, and I fell short.\n\nI value our connection more than my pride, and I hope we can talk when you're ready. I want to listen, understand, and make things right. Thank you for your patience and grace.`,
  },
];
