export interface Letter {
  id: string;
  title: string;
  recipient: string;
  sender: string;
  body: string;
  theme: 'romantic' | 'grateful' | 'apology' | 'birthday' | 'friendship' | 'simple';
  createdAt: string;
}

export const THEMES = {
  romantic: {
    name: 'Romantic',
    bg: 'bg-rose-50',
    paper: 'bg-stone-50 border border-rose-100/50 shadow-md',
    text: 'text-rose-950',
    titleColor: 'text-rose-800',
    accent: 'bg-rose-500 hover:bg-rose-600 text-white focus:ring-rose-200',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    secondary: 'text-rose-700/80',
    envelopeBg: 'from-rose-100 to-rose-200 border-rose-300',
    heartColor: '#f43f5e', // rose-500
    sparkleColor: '#fecdd3', // rose-200
  },
  grateful: {
    name: 'Grateful',
    bg: 'bg-amber-50/60',
    paper: 'bg-amber-50/20 border border-amber-100 shadow-md',
    text: 'text-amber-950',
    titleColor: 'text-amber-800',
    accent: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-200',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    secondary: 'text-amber-700/80',
    envelopeBg: 'from-amber-100 to-amber-200 border-amber-300',
    heartColor: '#f59e0b', // amber-500
    sparkleColor: '#fef3c7', // amber-100
  },
  apology: {
    name: 'Apology',
    bg: 'bg-slate-50',
    paper: 'bg-white border border-slate-200 shadow-md',
    text: 'text-slate-950',
    titleColor: 'text-slate-800',
    accent: 'bg-slate-600 hover:bg-slate-700 text-white focus:ring-slate-200',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    secondary: 'text-slate-700/80',
    envelopeBg: 'from-slate-100 to-slate-200 border-slate-300',
    heartColor: '#475569', // slate-600
    sparkleColor: '#cbd5e1', // slate-300
  },
  birthday: {
    name: 'Celebration',
    bg: 'bg-violet-50/50',
    paper: 'bg-white border border-violet-100 shadow-md',
    text: 'text-violet-950',
    titleColor: 'text-violet-800',
    accent: 'bg-violet-500 hover:bg-violet-600 text-white focus:ring-violet-200',
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
    secondary: 'text-violet-700/80',
    envelopeBg: 'from-violet-100 to-violet-200 border-violet-300',
    heartColor: '#8b5cf6', // violet-500
    sparkleColor: '#ddd6fe', // violet-200
  },
  friendship: {
    name: 'Friendship',
    bg: 'bg-emerald-50/50',
    paper: 'bg-stone-50 border border-emerald-100/50 shadow-md',
    text: 'text-emerald-950',
    titleColor: 'text-emerald-800',
    accent: 'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    secondary: 'text-emerald-700/80',
    envelopeBg: 'from-emerald-100 to-emerald-200 border-emerald-300',
    heartColor: '#10b981', // emerald-500
    sparkleColor: '#a7f3d0', // emerald-200
  },
  simple: {
    name: 'Classic',
    bg: 'bg-zinc-50',
    paper: 'bg-white border border-zinc-200 shadow-sm',
    text: 'text-zinc-900',
    titleColor: 'text-zinc-800',
    accent: 'bg-zinc-800 hover:bg-zinc-900 text-white focus:ring-zinc-200',
    badge: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    secondary: 'text-zinc-600',
    envelopeBg: 'from-zinc-100 to-zinc-200 border-zinc-300',
    heartColor: '#27272a', // zinc-800
    sparkleColor: '#e4e4e7', // zinc-200
  }
} as const;

export type ThemeKey = keyof typeof THEMES;

/**
 * Encodes a Letter object safely into a URL-friendly UTF-8 Base64 string.
 */
export function encodeLetter(letter: Omit<Letter, 'id' | 'createdAt'>): string {
  try {
    const json = JSON.stringify(letter);
    // encodeURIComponent protects non-ASCII characters, and unescape + btoa converts it safely.
    return btoa(unescape(encodeURIComponent(json)));
  } catch (error) {
    console.error('Failed to encode letter', error);
    return '';
  }
}

/**
 * Decodes a URL-friendly UTF-8 Base64 string back into a Letter object.
 */
export function decodeLetter(base64: string): Omit<Letter, 'id' | 'createdAt'> | null {
  try {
    // atob + escape + decodeURIComponent decodes non-ASCII characters safely.
    const decoded = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode letter', error);
    return null;
  }
}

/**
 * Self-test for encode/decode integrity (ponytail)
 */
export function runSelfTest(): boolean {
  try {
    const testData = {
      title: 'Test Love Letter',
      recipient: 'Aria',
      sender: 'Leo',
      body: 'I love you to the moon and back! ❤️ ✨',
      theme: 'romantic' as const
    };
    const encoded = encodeLetter(testData);
    const decoded = decodeLetter(encoded);
    const success = decoded && 
      decoded.title === testData.title && 
      decoded.recipient === testData.recipient && 
      decoded.sender === testData.sender && 
      decoded.body === testData.body && 
      decoded.theme === testData.theme;
    
    console.log(`[Letter Poster Self-Test] Encode/Decode Roundtrip: ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
    return !!success;
  } catch (error) {
    console.error('[Letter Poster Self-Test] Failed with error', error);
    return false;
  }
}
