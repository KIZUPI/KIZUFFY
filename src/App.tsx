import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Send, 
  PenTool, 
  Eye, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  Trash2, 
  Mail, 
  Plus, 
  ExternalLink,
  LogIn,
  LogOut,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logOut, handleFirestoreError, OperationType } from './firebase';
import { Letter, ThemeKey, THEMES, encodeLetter, decodeLetter, runSelfTest } from './types';

// Pre-defined writing prompts/templates for user inspiration (lazy senior dev design)
const TEMPLATES = [
  {
    name: '❤️ Romantic Whisper',
    title: 'To the one who holds my heart',
    theme: 'romantic' as const,
    recipient: 'My Beloved',
    sender: 'Yours Forever',
    body: `I wanted to write you something that words can barely carry. From the moment you walked into my life, everything took on a softer, brighter color. I love the quiet moments we share—the way you look when you laugh, the warmth of your hand in mine, and the silent understanding between us.\n\nYou are my home and my greatest adventure. No matter where life takes us, my heart will always wander back to you. Thank you for being you, beautifully and completely.`
  },
  {
    name: '✨ Warm Gratitude',
    title: 'A note of quiet appreciation',
    theme: 'grateful' as const,
    recipient: 'My Lifeline',
    sender: 'With Deep Thanks',
    body: `There are times in life when everything feels heavy, and then there are people who make that weight vanish just by existing. You are that person for me.\n\nThank you for listening when I didn't have the words, for standing by me when things got complicated, and for believing in me even when I couldn't see my own strength. This is just a simple letter to say that I see everything you do, and I am endlessly grateful for your presence in my life.`
  },
  {
    name: '🌿 Sincere Apology',
    title: 'From the bottom of my heart',
    theme: 'apology' as const,
    recipient: 'Dear Friend',
    sender: 'With Regret and Love',
    body: `I've been thinking a lot about what happened, and I want to apologize. My intention was never to hurt you, but I know that intentions don't excuse the outcome. You deserve my best, and I fell short.\n\nI value our connection more than my pride, and I hope we can talk when you're ready. I want to listen, understand, and make things right. Thank you for your patience and grace.`
  }
];

export default function App() {
  // Navigation & Hash-Routing State
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  
  // App-level state for Draft
  const [draft, setDraft] = useState<Omit<Letter, 'id' | 'createdAt'>>({
    title: '',
    recipient: '',
    sender: '',
    body: '',
    theme: 'romantic'
  });

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);

  // Copied alert feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Local storage / Database history of sent letters
  const [sentHistory, setSentHistory] = useState<Letter[]>([]);

  // Self-test results
  const [selfTestPassed, setSelfTestPassed] = useState<boolean>(false);

  // Auth Listener & Self-Test
  useEffect(() => {
    // Run self-test (ponytail mode check)
    const passed = runSelfTest();
    setSelfTestPassed(passed);

    // Set up Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        setIsAnonymousMode(false);
      }
    });

    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
      if (window.location.hash !== '#/compose' && window.location.hash !== '#/preview') {
        setIsAnonymousMode(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Sync user letters history (Database if logged in)
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSentHistory([]);
      return;
    }

    // Lazy load the user's customized letters from Firestore (No index-creation delay approach)
    const fetchUserLetters = async () => {
      try {
        const { getDocs, query, collection, where } = await import('firebase/firestore');
        const q = query(
          collection(db, 'letters'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const dbLetters: Letter[] = [];
        
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          const dateStr = date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          dbLetters.push({
            id: docSnap.id,
            title: data.title || '',
            recipient: data.recipient || '',
            sender: data.sender || '',
            body: data.body || '',
            theme: data.theme || 'romantic',
            createdAt: dateStr,
            userId: data.userId || null
          });
        });

        // In-memory sort by date to prevent composite index setup delays (ponytail: memory-sort)
        dbLetters.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSentHistory(dbLetters);
      } catch (err) {
        console.error('Error fetching letters from DB:', err);
      }
    };

    fetchUserLetters();
  }, [user, authLoading]);

  // Save history helper (in-memory state sync)
  const saveHistory = (updated: Letter[]) => {
    setSentHistory(updated);
  };

  const deleteFromHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this letter? This will remove it from both your history list and the database.')) {
      const updated = sentHistory.filter(l => l.id !== id);
      saveHistory(updated);

      // If it is a short Firestore letter ID and the user is logged in, delete from DB
      if (user && id.length < 50) {
        try {
          const { deleteDoc, doc } = await import('firebase/firestore');
          await deleteDoc(doc(db, 'letters', id));
        } catch (err) {
          console.error('Failed to delete letter from database:', err);
          handleFirestoreError(err, OperationType.DELETE, `letters/${id}`);
        }
      }
    }
  };

  // Route parser
  const getRoute = () => {
    const hash = currentHash;
    if (hash === '#/' || hash === '') return { name: 'landing' };
    if (hash === '#/compose') return { name: 'compose' };
    if (hash === '#/preview') return { name: 'preview' };
    
    if (hash.startsWith('#/success/')) {
      const id = hash.replace('#/success/', '');
      return { name: 'success', id };
    }
    if (hash.startsWith('#/letter/')) {
      const id = hash.replace('#/letter/', '');
      return { name: 'letter', id };
    }
    return { name: 'landing' };
  };

  const route = getRoute();

  // Helper to handle publishing draft (Google sign-in and DB post / Anonymous Base64)
  const handlePublish = async () => {
    if (!draft.title.trim() || !draft.recipient.trim() || !draft.sender.trim() || !draft.body.trim()) {
      alert('Please fill out all fields before publishing your letter.');
      return;
    }

    if (!user && !isAnonymousMode) {
      alert('You must sign in with Google to write and publish letters.');
      try {
        await signInWithGoogle();
      } catch (err) {
        return;
      }
    }

    setIsPublishing(true);

    try {
      if (isAnonymousMode && !user) {
        // Enforce pure client-side Base64/LZString generation!
        const b64 = encodeLetter(draft);
        if (!b64) {
          alert('Error encoding letter. Please try again.');
          setIsPublishing(false);
          return;
        }
        // Navigate without adding to history (so they can't view it afterwards)
        window.location.hash = `#/success/${b64}`;
        setIsPublishing(false);
        return;
      }

      const { serverTimestamp } = await import('firebase/firestore');
      
      // Save letter to Firestore under 'letters' collection
      const docRef = await addDoc(collection(db, 'letters'), {
        title: draft.title,
        recipient: draft.recipient,
        sender: draft.sender,
        body: draft.body,
        theme: draft.theme,
        userId: user!.uid,
        createdAt: serverTimestamp()
      });

      const localDateStr = new Date().toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const newLetter: Letter = {
        id: docRef.id, // Short, lovely Firestore ID!
        title: draft.title,
        recipient: draft.recipient,
        sender: draft.sender,
        body: draft.body,
        theme: draft.theme,
        createdAt: localDateStr,
        userId: user!.uid
      };

      saveHistory([newLetter, ...sentHistory]);

      // Clear draft and navigate
      window.location.hash = `#/success/${docRef.id}`;
    } catch (error) {
      console.error('Error publishing letter:', error);
      alert('Failed to post letter. Please try again.');
      handleFirestoreError(error, OperationType.CREATE, 'letters');
    } finally {
      setIsPublishing(false);
    }
  };

  // Render sub-views
  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900 transition-colors duration-500">
      
      {/* Sticky Top Header */}
      {route.name !== 'letter' && (
        <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="#/" className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
              <span className="font-serif font-semibold text-lg tracking-tight text-neutral-800">Letter Poster</span>
            </a>
            
            <div className="flex items-center gap-3">
              {authLoading ? (
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading account...</span>
                </div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-semibold text-neutral-800">{user.displayName || 'Sender'}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">{user.email}</span>
                  </div>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-rose-100 shadow-sm" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center font-bold text-xs border border-rose-100">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to sign out?')) {
                        logOut();
                      }
                    }}
                    className="p-2 rounded-full hover:bg-neutral-50 text-neutral-400 hover:text-red-500 transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          {route.name === 'landing' && (
            <LandingView 
              sentHistory={sentHistory} 
              onDelete={deleteFromHistory}
              onSelectDraft={(letter) => {
                setDraft(letter);
                window.location.hash = '#/compose';
              }}
              copiedId={copiedId}
              setCopiedId={setCopiedId}
              user={user}
              authLoading={authLoading}
            />
          )}

          {route.name === 'compose' && (
            <ComposeView 
              draft={draft} 
              setDraft={setDraft} 
              onPreview={() => { window.location.hash = '#/preview'; }}
              onPublish={handlePublish}
              user={user}
              authLoading={authLoading}
              isPublishing={isPublishing}
              isAnonymousMode={isAnonymousMode}
              setIsAnonymousMode={setIsAnonymousMode}
            />
          )}

          {route.name === 'preview' && (
            <PreviewView 
              draft={draft} 
              onBack={() => { window.location.hash = '#/compose'; }}
              onPublish={handlePublish}
              isPublishing={isPublishing}
            />
          )}

          {route.name === 'success' && (
            <SuccessView 
              id={route.id || ''} 
              copiedId={copiedId}
              setCopiedId={setCopiedId}
            />
          )}

          {route.name === 'letter' && (
            <LetterReaderView base64={route.id || ''} />
          )}
        </AnimatePresence>
      </main>


    </div>
  );
}

// ==========================================
// 1. LANDING VIEW
// ==========================================
interface LandingViewProps {
  sentHistory: Letter[];
  onDelete: (id: string, e: React.MouseEvent) => void;
  onSelectDraft: (letter: Omit<Letter, 'id' | 'createdAt'>) => void;
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
  user: User | null;
  authLoading: boolean;
}

function LandingView({ sentHistory, onDelete, onSelectDraft, copiedId, setCopiedId, user, authLoading }: LandingViewProps) {
  const copyLink = (base64: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const appUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${appUrl}#/letter/${base64}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(base64);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-16 w-full"
    >
      {/* Hero Section */}
      <div className="text-center flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-xs font-medium tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>A Gentle Way to Connect</span>
        </div>
        
        <h1 className="font-serif text-4xl md:text-6xl text-neutral-800 font-medium tracking-tight leading-[1.1] max-w-2xl">
          Write letters that <span className="text-rose-500 italic font-normal">feel alive</span>.
        </h1>
        
        <p className="text-neutral-500 text-base md:text-lg max-w-xl leading-relaxed">
          Compose personal letters, customize the emotional theme, and post them. Your recipient opens a beautiful heart-sealed envelope with dynamic hands-free auto-scrolling.
        </p>

        {!authLoading && (
          <div className="text-xs mt-1">
            {user ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3.5 py-1.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cloud active: signed in as <strong className="font-semibold">{user.displayName || user.email}</strong>. Letters are saved securely in Firestore!</span>
              </span>
            ) : (
              <button
                onClick={() => signInWithGoogle().catch(() => {})}
                className="inline-flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200/60 px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Google Sign-In is active. Click to log in & unlock short links!</span>
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <a 
            href="#/compose" 
            className="px-8 py-3.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-medium transition shadow-md hover:shadow-lg flex items-center gap-2 group"
          >
            <PenTool className="w-5 h-5" />
            <span>Write a Letter</span>
          </a>
          <button 
            onClick={() => {
              // Fill with one romantic preset instantly for demoing (senior lazy optimization)
              const romanticPreset = TEMPLATES[0];
              onSelectDraft({
                title: romanticPreset.title,
                recipient: romanticPreset.recipient,
                sender: romanticPreset.sender,
                body: romanticPreset.body,
                theme: romanticPreset.theme
              });
            }}
            className="px-6 py-3.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 font-medium transition shadow-sm hover:shadow"
          >
            Use Demo Preset
          </button>
        </div>
      </div>

      {/* Decorative Interactive Preview Card */}
      <div className="bg-gradient-to-tr from-rose-50/50 via-neutral-50 to-amber-50/30 p-8 rounded-3xl border border-neutral-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="flex-1 flex flex-col gap-4">
          <h3 className="font-serif text-2xl text-neutral-800 font-medium">The Magical Opening</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            When your recipient opens your shared link, they will see a soft, floating heart envelope. Tapping the heart reveals your letter with a gentle slide animation and comfortable auto-scrolling so they can enjoy your words hands-free.
          </p>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500" /> Beautiful Themes</span>
            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500" /> Slow Auto-Scroll</span>
            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500" /> Fully Responsive</span>
          </div>
        </div>

        <div className="flex-1 flex justify-center py-4">
          {/* Mock Envelope Preview */}
          <div className="relative w-64 h-40 rounded-2xl bg-gradient-to-b from-rose-50 to-rose-100 border border-rose-200 flex flex-col items-center justify-center shadow-md animate-pulse">
            <Heart className="w-12 h-12 text-rose-500 fill-rose-500/20 drop-shadow-sm" />
            <span className="text-[10px] font-mono tracking-widest text-rose-400 mt-2 uppercase">Open envelope</span>
          </div>
        </div>
      </div>

      {/* Your Sent Letters (History) - Only visible to authenticated users to ensure absolute privacy */}
      {user && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <h2 className="font-serif text-2xl text-neutral-800 font-medium flex items-center gap-2">
              <Mail className="w-5 h-5 text-neutral-400" />
              <span>Your Sent Letters ({sentHistory.length})</span>
            </h2>
          </div>

          {sentHistory.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-200 rounded-2xl flex flex-col items-center gap-3">
              <BookOpen className="w-8 h-8 text-neutral-300" />
              <p className="text-neutral-500 text-sm">No letters written yet under your account.</p>
              <a href="#/compose" className="text-rose-500 hover:text-rose-600 text-xs font-semibold underline">
                Write your first letter now
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sentHistory.map((letter) => {
                const themeInfo = THEMES[letter.theme as ThemeKey] || THEMES.romantic;
                return (
                  <div 
                    key={letter.id}
                    onClick={() => { window.location.hash = `#/letter/${letter.id}`; }}
                    className="bg-white hover:bg-neutral-50 border border-neutral-100 rounded-2xl p-5 shadow-sm hover:shadow transition duration-200 flex flex-col justify-between gap-4 cursor-pointer relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-self-start text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${themeInfo.badge} w-fit`}>
                          {themeInfo.name}
                        </span>
                        <h4 className="font-serif font-medium text-neutral-800 text-lg mt-2 truncate max-w-[200px]">
                          {letter.title || 'Untitled Letter'}
                        </h4>
                        <p className="text-xs text-neutral-400">
                          To: <span className="font-medium text-neutral-600">{letter.recipient}</span> • From: <span className="font-medium text-neutral-600">{letter.sender}</span>
                        </p>
                      </div>
                      <button 
                        onClick={(e) => onDelete(letter.id, e)}
                        className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition"
                        title="Delete this letter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-400">
                      <span>{letter.createdAt}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => copyLink(letter.id, e)}
                          className="flex items-center gap-1 text-rose-500 hover:text-rose-600 transition font-medium"
                        >
                          {copiedId === letter.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ==========================================
// 2. COMPOSE VIEW
// ==========================================
interface ComposeViewProps {
  draft: Omit<Letter, 'id' | 'createdAt'>;
  setDraft: React.Dispatch<React.SetStateAction<Omit<Letter, 'id' | 'createdAt'>>>;
  onPreview: () => void;
  onPublish: () => void;
  user: User | null;
  authLoading: boolean;
  isPublishing: boolean;
  isAnonymousMode: boolean;
  setIsAnonymousMode: React.Dispatch<React.SetStateAction<boolean>>;
}

function ComposeView({ draft, setDraft, onPreview, onPublish, user, authLoading, isPublishing, isAnonymousMode, setIsAnonymousMode }: ComposeViewProps) {
  // Handle field updates
  const updateField = (field: keyof typeof draft, val: any) => {
    setDraft(prev => ({ ...prev, [field]: val }));
  };

  // Quick select prompt/template handler
  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    if (draft.body.trim() && !confirm('Applying this template will overwrite your current draft. Continue?')) {
      return;
    }
    setDraft({
      title: tpl.title,
      recipient: tpl.recipient,
      sender: tpl.sender,
      body: tpl.body,
      theme: tpl.theme
    });
  };

  const themeConfig = THEMES[draft.theme] || THEMES.romantic;

  // Immersive Google Sign-In prompt block
  if (!authLoading && !user && !isAnonymousMode) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="max-w-md mx-auto px-6 py-20 w-full flex flex-col items-center text-center gap-6"
      >
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 text-rose-500 shadow-inner">
          <Heart className="w-8 h-8 fill-rose-500/20 text-rose-500" />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="font-serif text-3xl font-medium text-neutral-800">Secure Composing</h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Please sign in with Google to write and compose letters. This ensures that letters are stored securely and only viewable by you and your recipient.
          </p>
        </div>
        <button
          onClick={() => signInWithGoogle().catch(() => {})}
          className="w-full py-3.5 px-6 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn className="w-5 h-5" />
          <span>Sign In with Google</span>
        </button>

        <button
          onClick={() => setIsAnonymousMode(true)}
          className="w-full py-2.5 px-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-semibold transition border border-neutral-200/60 flex items-center justify-center gap-2 cursor-pointer text-xs"
        >
          Write Anonymously instead
        </button>

        <a href="#/" className="text-xs text-neutral-400 hover:text-neutral-600 underline">
          Go back to Home Page
        </a>
      </motion.div>
    );
  }

  // Loading spinner during auth check
  if (authLoading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-32 flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <span className="text-sm text-neutral-500 font-medium">Authorizing account...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-4xl mx-auto px-6 py-10 w-full flex flex-col gap-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <a href="#/" className="inline-flex items-center justify-center p-2 rounded-full hover:bg-neutral-100 text-neutral-500 transition">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-neutral-800">Compose Letter</h1>
            <p className="text-neutral-400 text-xs">Your letter is automatically structured and beautifully styled.</p>
          </div>
        </div>

        {isAnonymousMode && !user && (
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/60 px-3.5 py-1.5 rounded-full text-xs font-medium self-start sm:self-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Anonymous Mode: No cloud history, link-sharing only</span>
          </div>
        )}
      </div>

      {/* Preset Inspiration Pills (Senior Lazy Optimization - instant setup) */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Quick Inspiration Templates</span>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              onClick={() => applyTemplate(tpl)}
              className="px-4 py-2 rounded-full text-xs font-medium bg-white hover:bg-rose-50 border border-neutral-200 hover:border-rose-100 text-neutral-700 hover:text-rose-700 transition shadow-sm cursor-pointer"
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Settings Panel */}
        <div className="lg:col-span-4 bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <h3 className="font-serif text-lg font-medium text-neutral-800 pb-3 border-b border-neutral-100">Letter Customizer</h3>

          {/* Theme Selector */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Emotional Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(THEMES).map(([key, config]) => {
                const isSelected = draft.theme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateField('theme', key as ThemeKey)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${
                      isSelected 
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow' 
                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full`} style={{ backgroundColor: config.heartColor }}></span>
                    <span>{config.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Envelope Envelope Stamp Preview */}
          <div className="rounded-2xl p-4 bg-neutral-50 border border-neutral-200/60 flex flex-col items-center gap-3 text-center">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Selected Envelope Theme</span>
            <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200/80 flex items-center justify-center border border-neutral-300 relative shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-tr from-transparent to-white/30" />
              <Heart className="w-6 h-6" style={{ color: themeConfig.heartColor, fill: `${themeConfig.heartColor}20` }} />
            </div>
            <p className="text-xs text-neutral-500">
              Your reader opens a <span className="font-medium text-neutral-700">{themeConfig.name}</span> colored envelope.
            </p>
          </div>
        </div>

        {/* Right Editor Panel */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className={`p-6 md:p-8 rounded-3xl ${themeConfig.paper} transition-colors duration-500 flex flex-col gap-6`}>
            
            {/* Headers / Metadata inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Recipient Name</label>
                <input 
                  type="text"
                  placeholder="e.g., My Dear Julia"
                  value={draft.recipient}
                  onChange={(e) => updateField('recipient', e.target.value)}
                  className={`px-3 py-2 border border-neutral-200/60 rounded-xl text-sm focus:outline-none focus:border-rose-300 bg-white/70 ${themeConfig.text}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Sender / Signature</label>
                <input 
                  type="text"
                  placeholder="e.g., Yours Forever, Rowan"
                  value={draft.sender}
                  onChange={(e) => updateField('sender', e.target.value)}
                  className={`px-3 py-2 border border-neutral-200/60 rounded-xl text-sm focus:outline-none focus:border-rose-300 bg-white/70 ${themeConfig.text}`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Letter Title</label>
              <input 
                type="text"
                placeholder="A whisper of warm thoughts"
                value={draft.title}
                onChange={(e) => updateField('title', e.target.value)}
                className={`px-3.5 py-2.5 border border-neutral-200/60 rounded-xl text-sm md:text-base font-serif focus:outline-none focus:border-rose-300 bg-white/70 ${themeConfig.titleColor}`}
              />
            </div>

            {/* Letter Body Textarea */}
            <div className="flex flex-col gap-1.5 flex-grow">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Your Message</label>
              <textarea 
                placeholder="Write your letter here... Pour your heart out."
                value={draft.body}
                onChange={(e) => updateField('body', e.target.value)}
                rows={12}
                className={`px-4 py-3.5 border border-neutral-200/60 rounded-2xl text-sm md:text-base font-serif leading-relaxed focus:outline-none focus:border-rose-300 bg-white/70 h-80 ${themeConfig.text}`}
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>Markdown formats automatically with simple paragraphs</span>
                <span>{draft.body.length} characters</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 mt-4">
            <button 
              type="button"
              onClick={onPreview}
              disabled={isPublishing || !draft.body.trim()}
              className="px-6 py-3 rounded-full border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Letter</span>
            </button>
            <button 
              type="button"
              onClick={onPublish}
              disabled={isPublishing || !draft.body.trim() || !draft.recipient.trim() || !draft.sender.trim() || !draft.title.trim()}
              className="px-8 py-3 rounded-full text-sm font-semibold transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Post Letter</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// 3. PREVIEW VIEW
// ==========================================
interface PreviewViewProps {
  draft: Omit<Letter, 'id' | 'createdAt'>;
  onBack: () => void;
  onPublish: () => void;
  isPublishing: boolean;
}

function PreviewView({ draft, onBack, onPublish, isPublishing }: PreviewViewProps) {
  const themeConfig = THEMES[draft.theme] || THEMES.romantic;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-4xl mx-auto px-6 py-10 w-full flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          disabled={isPublishing}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-700 text-sm font-medium transition disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit Draft</span>
        </button>
        <span className="text-xs bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1 rounded-full font-semibold">
          Preview Mode
        </span>
      </div>

      <div className="bg-neutral-100/40 p-4 md:p-8 rounded-3xl border border-neutral-200/50 flex flex-col gap-6">
        <p className="text-center text-xs text-neutral-400 font-mono tracking-widest uppercase">
          How your letter will look to your reader:
        </p>
        
        {/* Nested envelope & letter simulator */}
        <div className="border border-neutral-200/60 rounded-2xl bg-white shadow-inner p-6 flex items-center justify-center min-h-[500px]">
          <LetterReaderView isPreview={true} previewData={draft} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button 
          onClick={onBack}
          disabled={isPublishing}
          className="px-6 py-3 rounded-full border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-sm font-semibold transition cursor-pointer disabled:opacity-50"
        >
          Back to Editor
        </button>
        <button 
          onClick={onPublish}
          disabled={isPublishing}
          className="px-8 py-3 rounded-full text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 transition shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Publish & Get Share Link</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ==========================================
// 4. SUCCESS VIEW
// ==========================================
interface SuccessViewProps {
  id: string;
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
}

function SuccessView({ id, copiedId, setCopiedId }: SuccessViewProps) {
  const appUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${appUrl}#/letter/${id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-8 w-full"
    >
      <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-500 animate-bounce">
        <Check className="w-8 h-8 text-emerald-600" />
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-3xl font-medium text-neutral-800">Your letter is posted!</h1>
        <p className="text-neutral-500 text-sm max-w-sm">
          It is beautifully sealed in a digital envelope. Send the shareable link below to your beloved.
        </p>
      </div>

      {/* Copy link box */}
      <div className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest self-start">Shareable URL Link</span>
        <div className="flex items-center gap-2 bg-white border border-neutral-150 rounded-xl p-2.5 shadow-inner">
          <input 
            type="text" 
            readOnly 
            value={shareUrl} 
            className="flex-1 text-xs text-neutral-600 bg-transparent focus:outline-none select-all font-mono overflow-ellipsis" 
          />
          <button 
            onClick={copyToClipboard}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
          >
            {copiedId === id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <a 
          href={`#/letter/${id}`} 
          className="w-full sm:flex-1 py-3 px-6 rounded-full text-sm font-semibold bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 transition shadow-sm hover:shadow flex items-center justify-center gap-1.5"
        >
          <span>View Public Page</span>
          <ExternalLink className="w-4 h-4" />
        </a>
        <a 
          href="#/compose" 
          className="w-full sm:flex-1 py-3 px-6 rounded-full text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 transition shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Write Another</span>
        </a>
      </div>
    </motion.div>
  );
}

// ==========================================
// 5. PUBLIC LETTER READING PAGE (THE MAGIC MOMENT)
// ==========================================
interface LetterReaderViewProps {
  base64?: string;
  isPreview?: boolean;
  previewData?: Omit<Letter, 'id' | 'createdAt'>;
}

function LetterReaderView({ base64, isPreview = false, previewData }: LetterReaderViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(0.030); // pixels per ms
  const [hasFinished, setHasFinished] = useState(false);

  // Sparkles/particles floating out on open
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  // Ref for the scrollable paper
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Stateful fetching/decoding
  const [dbLetter, setDbLetter] = useState<Omit<Letter, 'id' | 'createdAt'> | null>(null);
  const [loading, setLoading] = useState(!isPreview);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isPreview) {
      setLoading(false);
      return;
    }
    if (!base64) {
      setLoading(false);
      setErrorMsg('No letter ID was specified in the URL.');
      return;
    }

    // 1. Check if the URL parameter is a legacy Base64 encoded letter
    const legacyDecoded = decodeLetter(base64);
    if (legacyDecoded) {
      setDbLetter(legacyDecoded);
      setLoading(false);
      return;
    }

    // 2. Otherwise, fetch from Firestore securely using getDoc
    setLoading(true);
    setErrorMsg(null);
    const fetchLetter = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'letters', base64));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDbLetter({
            title: data.title || '',
            recipient: data.recipient || '',
            sender: data.sender || '',
            body: data.body || '',
            theme: data.theme || 'romantic'
          });
        } else {
          setErrorMsg('This letter was not found. Please double check your shared link.');
        }
      } catch (err) {
        console.error('Error loading letter:', err);
        setErrorMsg('Access denied or letter private. Please check with the creator.');
      } finally {
        setLoading(false);
      }
    };

    fetchLetter();
  }, [base64, isPreview]);

  const letter = isPreview ? previewData : dbLetter;

  // Render loading state
  if (loading) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center min-h-screen bg-rose-50/20 gap-4">
        <div className="relative flex items-center justify-center">
          <Heart className="w-12 h-12 text-rose-500 fill-rose-500/10 animate-ping absolute" />
          <Heart className="w-12 h-12 text-rose-500 fill-rose-500/20" />
        </div>
        <span className="text-sm text-rose-500/80 font-serif font-medium tracking-wide">Retrieving letter...</span>
      </div>
    );
  }

  // Render error boundaries
  if (errorMsg) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center min-h-screen bg-neutral-50 gap-6 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border border-red-100 text-red-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2 max-w-md">
          <h2 className="font-serif text-2xl font-semibold text-neutral-800">Secure digital envelope</h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            {errorMsg}
          </p>
        </div>
        <a 
          href="#/" 
          className="px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition shadow-sm hover:shadow"
        >
          Go back to Home Page
        </a>
      </div>
    );
  }

  // Trigger heart opening effects
  const openLetter = () => {
    if (isOpen) return;
    setIsOpen(true);

    // Spawn sparks (ponytail details for satisfying microinteraction)
    const newSparks = Array.from({ length: 15 }).map((_, i) => ({
      id: Math.random() + i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200 - 50,
      delay: Math.random() * 0.2
    }));
    setSparks(newSparks);

    // Give a small delay before auto-scrolling starts so the letter can slide up beautifully
    setTimeout(() => {
      setIsScrolling(true);
    }, 1800);
  };

  // Slow delta-time based auto scroll implementation (highly frame-rate robust)
  useEffect(() => {
    if (!isOpen || !isScrolling || !scrollContainerRef.current) return;

    let animationId: number;
    let lastTime = performance.now();

    const smoothScroll = (time: number) => {
      if (!scrollContainerRef.current) return;

      const delta = time - lastTime;
      lastTime = time;

      // Scroll container
      scrollContainerRef.current.scrollTop += scrollSpeed * delta;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      
      // Stop when hitting the bottom
      if (scrollTop + clientHeight >= scrollHeight - 3) {
        setIsScrolling(false);
        setHasFinished(true);
        return;
      }

      animationId = requestAnimationFrame(smoothScroll);
    };

    animationId = requestAnimationFrame(smoothScroll);
    return () => cancelAnimationFrame(animationId);
  }, [isOpen, isScrolling, scrollSpeed]);

  if (!letter) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center gap-4">
        <Mail className="w-12 h-12 text-neutral-300 animate-pulse" />
        <h2 className="font-serif text-2xl text-neutral-800">Letter Not Found</h2>
        <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
          The link might be broken or incomplete. Please check with your sender for the full URL link.
        </p>
        <a href="#/" className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold">
          Go to Letter Poster
        </a>
      </div>
    );
  }

  const themeConfig = THEMES[letter.theme as ThemeKey] || THEMES.romantic;

  return (
    <div className={`flex-grow w-full flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden transition-colors duration-1000 ${themeConfig.bg}`}>
      
      {/* Decorative Floating Sparkles background on public links */}
      {!isPreview && (
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-rose-300 rounded-full blur-xs animate-bounce" style={{ animationDuration: '6s' }} />
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-amber-200 rounded-full blur-xs animate-bounce" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/4 right-1/3 w-5 h-5 bg-violet-300 rounded-full blur-xs animate-bounce" style={{ animationDuration: '10s' }} />
        </div>
      )}

      {/* Main Magical Scene */}
      <div className="w-full max-w-xl relative flex flex-col items-center justify-center min-h-[500px]">
        
        <AnimatePresence mode="wait">
          {!isOpen ? (
            /* ==================== 1. CLOSED ENVELOPE SCENE ==================== */
            <motion.div
              key="closed-envelope"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="flex flex-col items-center gap-8 cursor-pointer relative"
              onClick={openLetter}
            >
              <div className="text-center flex flex-col gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-neutral-500">
                  You received a letter
                </span>
                <h2 className="font-serif text-xl font-medium text-neutral-800">
                  From: <span className="text-rose-600 font-semibold">{letter.sender}</span>
                </h2>
              </div>

              {/* Envelope Body */}
              <div className="relative w-72 sm:w-96 h-48 sm:h-56 rounded-2xl bg-white border border-neutral-200 shadow-xl flex items-center justify-center group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-neutral-50 to-neutral-100/30" />
                
                {/* Envelope fold overlays */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-neutral-100" />
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[96px] sm:border-t-[110px] border-t-neutral-100 border-r-[144px] sm:border-r-[192px] border-r-transparent pointer-events-none opacity-40" />
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[96px] sm:border-t-[110px] border-t-neutral-100 border-l-[144px] sm:border-l-[192px] border-l-transparent pointer-events-none opacity-40" />
                
                {/* Envelope Pocket */}
                <div className="absolute bottom-0 inset-x-0 h-28 sm:h-32 bg-neutral-50 border-t border-neutral-200/80 rounded-b-2xl flex items-end justify-center p-4" />

                {/* HEART BUTTON (THE SEAL) */}
                <motion.div 
                  className="absolute z-10 flex flex-col items-center gap-2"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg border border-neutral-150 relative">
                    <div className="absolute inset-0 rounded-full bg-rose-100 animate-ping opacity-30" />
                    <Heart 
                      className="w-8 h-8 drop-shadow-sm" 
                      style={{ color: themeConfig.heartColor, fill: themeConfig.heartColor }} 
                    />
                  </div>
                </motion.div>
              </div>

              <div className="text-center text-xs text-neutral-400 font-medium animate-pulse">
                Click the heart to open & reveal
              </div>
            </motion.div>
          ) : (
            /* ==================== 2. OPENED REVEAL SCENE ==================== */
            <motion.div
              key="opened-letter"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
              className="w-full flex flex-col gap-6"
            >
              {/* Floating sparks (particles) rendered on reveal */}
              {sparks.map((spark) => (
                <motion.div
                  key={spark.id}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: spark.x, y: spark.y, opacity: 0, scale: 0.3 }}
                  transition={{ delay: spark.delay, duration: 1.2, ease: 'easeOut' }}
                  className="absolute z-30 pointer-events-none"
                  style={{ top: '35%', left: '50%' }}
                >
                  <Heart className="w-4 h-4 fill-rose-400 text-rose-300" style={{ color: themeConfig.heartColor, fill: themeConfig.heartColor }} />
                </motion.div>
              ))}

              {/* Autoscrolling Letter Card */}
              <div 
                className={`w-full h-[480px] rounded-3xl ${themeConfig.paper} shadow-2xl flex flex-col overflow-hidden relative`}
              >
                {/* Paper texture overlay */}
                <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-white/80 to-transparent pointer-events-none z-10" />

                {/* Auto Scrollable Window container */}
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto px-6 md:px-10 py-12 flex flex-col gap-8 no-scrollbar"
                >
                  {/* Letter Header */}
                  <div className="border-b border-neutral-100 pb-4 flex flex-col gap-2 mt-4">
                    <div className="flex justify-between text-xs text-neutral-400 font-mono">
                      <span>Dearest {letter.recipient}</span>
                    </div>
                    <h1 className={`font-serif text-2xl font-medium tracking-tight ${themeConfig.titleColor}`}>
                      {letter.title || 'A gentle letter'}
                    </h1>
                  </div>

                  {/* Letter Body Content */}
                  <div className={`font-serif text-sm md:text-base leading-[1.8] whitespace-pre-wrap ${themeConfig.text} tracking-wide opacity-90`}>
                    {letter.body}
                  </div>

                  {/* Letter Footer Signature */}
                  <div className="mt-8 border-t border-neutral-100 pt-6 flex flex-col gap-1 items-end">
                    <span className="text-xs text-neutral-400 font-mono italic">Written with love,</span>
                    <span className="font-serif font-semibold text-lg text-neutral-800 italic pr-2">
                      {letter.sender}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-white/80 to-transparent pointer-events-none z-10" />
              </div>

              {/* Controller Bar (pause, resume, speed, restart) */}
              <div className="bg-white/95 backdrop-blur-xs border border-neutral-150 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md text-xs z-20">
                <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsScrolling(!isScrolling)}
                      className="w-10 h-10 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition"
                      title={isScrolling ? "Pause scrolling" : "Resume scrolling"}
                    >
                      {isScrolling ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (scrollContainerRef.current) {
                          scrollContainerRef.current.scrollTop = 0;
                          setHasFinished(false);
                          setIsScrolling(true);
                        }
                      }}
                      className="w-8 h-8 rounded-full border border-neutral-200 hover:bg-neutral-50 text-neutral-600 flex items-center justify-center transition"
                      title="Restart from beginning"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status Indicator */}
                  <span className="text-neutral-500 font-medium">
                    {hasFinished ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Finished
                      </span>
                    ) : isScrolling ? (
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span>Auto-scrolling...</span>
                      </span>
                    ) : (
                      <span className="text-neutral-400">Paused</span>
                    )}
                  </span>
                </div>

                {/* Speed Controls (0.030 to 0.120 px/ms) */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 border-t sm:border-t-0 sm:border-l border-neutral-100 pt-2.5 sm:pt-0 sm:pl-3">
                  <span className="text-neutral-400 text-[10px] uppercase font-semibold">Speed:</span>
                  <div className="flex gap-1">
                    {[
                      { label: 'Slow', val: 0.030 },
                      { label: 'Med', val: 0.070 },
                      { label: 'Fast', val: 0.120 }
                    ].map((spd) => (
                      <button
                        key={spd.label}
                        onClick={() => {
                          setScrollSpeed(spd.val);
                          setIsScrolling(true);
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium transition ${
                          scrollSpeed === spd.val 
                            ? 'bg-rose-50 border border-rose-100 text-rose-600' 
                            : 'border border-neutral-200 hover:bg-neutral-50 text-neutral-500'
                        }`}
                      >
                        {spd.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Show Back to Editor link if previewing */}
              {isPreview && (
                <p className="text-center text-xs text-rose-500 font-medium bg-rose-50 py-2 px-4 rounded-xl border border-rose-100">
                  This is a preview. The envelope seal, layout, auto-scroll and speed controls operate identically for your reader.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
