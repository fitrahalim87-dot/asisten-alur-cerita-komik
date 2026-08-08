import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Home as HomeIcon, 
  Scissors, 
  FileText, 
  Volume2, 
  Video, 
  Upload, 
  Trash2, 
  Play, 
  Pause, 
  Download, 
  Copy, 
  Check, 
  Loader2, 
  Settings, 
  Info, 
  Sparkles, 
  Globe, 
  Moon, 
  Sun, 
  Maximize, 
  ArrowRight,
  RefreshCw,
  Plus,
  Sliders,
  CheckCircle2,
  X,
  FileDown,
  Key,
  ExternalLink,
  ShieldAlert,
  Smartphone
} from 'lucide-react';

const VOICES = [
  { name: 'Ardi - Laki-laki Natural (id-ID-ArdiNeural)', value: 'id-ID-ArdiNeural' },
  { name: 'Andrew - Laki-laki Karismatik (en-US-AndrewNeural)', value: 'en-US-AndrewNeural' },
  { name: 'Gadis - Perempuan Natural (id-ID-GadisNeural)', value: 'id-ID-GadisNeural' },
  { name: 'Ava - Perempuan Lembut (en-US-AvaNeural)', value: 'en-US-AvaNeural' }
];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'manual' | 'naskah' | 'tts' | 'video-script'>('home');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Gemini API Key User Settings
  const [userGeminiKey, setUserGeminiKey] = useState<string>(() => {
    return localStorage.getItem('user_gemini_api_key') || '';
  });
  const [keyInputTemp, setKeyInputTemp] = useState(userGeminiKey);
  const [keyTestLoading, setKeyTestLoading] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // PWA Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowPwaModal(true);
    }
  };

  // ------------------------------------------------------------------
  // TAB 2: MANUAL (Asisten Manual & Slicing)
  // ------------------------------------------------------------------
  const [manualImages, setManualImages] = useState<string[]>([]);
  const [manualHook, setManualHook] = useState(true);
  const [manualOutro, setManualOutro] = useState(true);
  const [manualWordCount, setManualWordCount] = useState(1000);
  const [manualStyle, setManualStyle] = useState<'baku' | 'santai'>('baku');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualScriptResult, setManualScriptResult] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualCopied, setManualCopied] = useState(false);

  // Per-panel manual states
  const [panelScripts, setPanelScripts] = useState<string[]>([]);
  const [panelVoices, setPanelVoices] = useState<string[]>([]);
  const [panelAudioUrls, setPanelAudioUrls] = useState<(string | null)[]>([]);
  const [panelLoading, setPanelLoading] = useState<boolean[]>([]);
  const [panelTtsLoading, setPanelTtsLoading] = useState<boolean[]>([]);

  // ------------------------------------------------------------------
  // TAB 3: NASKAH (Multi-Panel Manga Script)
  // ------------------------------------------------------------------
  const [mangaImages, setMangaImages] = useState<string[]>([]);
  const [mangaHook, setMangaHook] = useState(true);
  const [mangaOutro, setMangaOutro] = useState(true);
  const [mangaWordCount, setMangaWordCount] = useState(1000);
  const [mangaStyle, setMangaStyle] = useState<'baku' | 'santai'>('santai');
  const [mangaLoading, setMangaLoading] = useState(false);
  const [mangaScriptResult, setMangaScriptResult] = useState('');
  const [mangaError, setMangaError] = useState<string | null>(null);
  const [mangaCopied, setMangaCopied] = useState(false);

  // ------------------------------------------------------------------
  // TAB 4: TTS (Text to Speech)
  // ------------------------------------------------------------------
  const [ttsText, setTtsText] = useState('');
  const [ttsVoice, setTtsVoice] = useState('id-ID-ArdiNeural');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ------------------------------------------------------------------
  // TAB 5: SKRIP VIDEO
  // ------------------------------------------------------------------
  const [videoIdea, setVideoIdea] = useState('');
  const [videoDuration, setVideoDuration] = useState('30 Detik');
  const [videoPlatform, setVideoPlatform] = useState('TikTok / Reels');
  const [videoTone, setVideoTone] = useState('Dramatis & Epik');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoScriptResult, setVideoScriptResult] = useState('');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoCopied, setVideoCopied] = useState(false);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Save Gemini Key
  const handleSaveGeminiKey = () => {
    const cleanedKey = keyInputTemp.trim();
    localStorage.setItem('user_gemini_api_key', cleanedKey);
    setUserGeminiKey(cleanedKey);
    setKeyTestResult({ success: true, message: 'Kunci API Gemini berhasil disimpan!' });
  };

  // Delete Gemini Key
  const handleDeleteGeminiKey = () => {
    localStorage.removeItem('user_gemini_api_key');
    setUserGeminiKey('');
    setKeyInputTemp('');
    setKeyTestResult(null);
  };

  // Test Gemini Key
  const handleTestGeminiKey = async () => {
    const testKey = keyInputTemp.trim();
    if (!testKey) {
      setKeyTestResult({ success: false, message: 'Masukkan Kunci API Gemini terlebih dahulu!' });
      return;
    }
    setKeyTestLoading(true);
    setKeyTestResult(null);
    try {
      const response = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: testKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menghubungi server pengujian.");

      if (data.success && data.text) {
        setKeyTestResult({ success: true, message: `Koneksi berhasil! Server merespon: "${data.text.trim()}"` });
      } else {
        setKeyTestResult({ success: false, message: 'Kunci valid tetapi tidak mengembalikan teks.' });
      }
    } catch (err: any) {
      setKeyTestResult({ success: false, message: `Koneksi gagal: ${err.message || String(err)}` });
    } finally {
      setKeyTestLoading(false);
    }
  };

  // Helper to read file as Data URL
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => resolve((evt.target?.result as string) || '');
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle Upload Image Helpers (Auto-sorted naturally by filename: image 1, image 2, image 3, etc.)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Natural alphanumeric sort by filename (image 1, image 2, image 3, image 10)
    const sortedFiles = (Array.from(files) as File[]).sort((a: File, b: File) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    try {
      const loadedDataUrls = await Promise.all(sortedFiles.map(readFileAsDataURL));
      const validDataUrls = loadedDataUrls.filter(Boolean);
      if (validDataUrls.length > 0) {
        setter(prev => [...prev, ...validDataUrls]);
      }
    } catch (err) {
      console.error("Gagal membaca file gambar:", err);
    } finally {
      e.target.value = '';
    }
  };

  // Handle Manual Images Upload and State Sync (Auto-sorted naturally by filename: image 1, image 2, image 3, etc.)
  const handleUploadManualImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Natural alphanumeric sort by filename (image 1, image 2, image 3, image 10)
    const sortedFiles = (Array.from(files) as File[]).sort((a: File, b: File) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    try {
      const loadedDataUrls = await Promise.all(sortedFiles.map(readFileAsDataURL));
      const validDataUrls = loadedDataUrls.filter(Boolean);
      const count = validDataUrls.length;

      if (count > 0) {
        setManualImages((prev) => [...prev, ...validDataUrls]);
        setPanelScripts((s) => [...s, ...new Array(count).fill('')]);
        setPanelVoices((v) => [...v, ...new Array(count).fill('id-ID-ArdiNeural')]);
        setPanelAudioUrls((a) => [...a, ...new Array(count).fill(null)]);
        setPanelLoading((l) => [...l, ...new Array(count).fill(false)]);
        setPanelTtsLoading((t) => [...t, ...new Array(count).fill(false)]);
      }
    } catch (err) {
      console.error("Gagal membaca file gambar manual:", err);
    } finally {
      e.target.value = '';
    }
  };

  const handleDeletePanel = (index: number) => {
    setManualImages(prev => prev.filter((_, i) => i !== index));
    setPanelScripts(prev => prev.filter((_, i) => i !== index));
    setPanelVoices(prev => prev.filter((_, i) => i !== index));
    setPanelAudioUrls(prev => prev.filter((_, i) => i !== index));
    setPanelLoading(prev => prev.filter((_, i) => i !== index));
    setPanelTtsLoading(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllPanels = () => {
    setManualImages([]);
    setPanelScripts([]);
    setPanelVoices([]);
    setPanelAudioUrls([]);
    setPanelLoading([]);
    setPanelTtsLoading([]);
    setManualScriptResult('');
  };

  // Generate All Manual Scripts (Batch)
  const handleGenerateManualScript = async () => {
    if (!userGeminiKey) {
      setShowSettingsModal(true);
      setKeyTestResult({ success: false, message: 'Silakan masukkan Kunci API Gemini Anda terlebih dahulu untuk menggunakan fitur AI.' });
      return;
    }
    if (manualImages.length === 0) {
      setManualError('Silakan unggah minimal 1 gambar panel komik.');
      return;
    }
    setManualLoading(true);
    setManualError(null);

    try {
      const response = await fetch('/api/generate-manga-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': userGeminiKey
        },
        body: JSON.stringify({
          images: manualImages,
          style: manualStyle,
          wordCount: manualWordCount,
          useHook: manualHook,
          useOutro: manualOutro
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menghasilkan naskah alur cerita.');
      
      const fullScript = data.script || '';
      const scriptsArr = data.scripts || [];

      setManualScriptResult(fullScript);

      if (Array.isArray(scriptsArr) && scriptsArr.length > 0) {
        const updatedScripts = manualImages.map((_, i) => scriptsArr[i] || '');
        setPanelScripts(updatedScripts);
      } else if (fullScript) {
        const paragraphs = fullScript.split('\n\n').filter(Boolean);
        const updatedScripts = manualImages.map((_, i) => paragraphs[i] || '');
        setPanelScripts(updatedScripts);
      }
    } catch (err: any) {
      setManualError(err.message || String(err));
    } finally {
      setManualLoading(false);
    }
  };

  // Combine All Panel Scripts
  const handleCombineAllScripts = () => {
    const combined = panelScripts.filter(s => s && s.trim()).join('\n\n');
    if (!combined) {
      setManualError('Belum ada naskah panel yang ditulis. Silakan tulis atau buat naskah otomatis per panel terlebih dahulu.');
      return;
    }
    setManualScriptResult(combined);
    setManualError(null);
  };

  // Generate Single Panel Script with Context Continuity
  const handleGenerateSinglePanelScript = async (index: number) => {
    if (!userGeminiKey) {
      setShowSettingsModal(true);
      setKeyTestResult({ success: false, message: 'Silakan masukkan Kunci API Gemini Anda terlebih dahulu untuk menggunakan fitur AI.' });
      return;
    }

    setPanelLoading(prev => {
      const copy = [...prev];
      copy[index] = true;
      return copy;
    });
    setManualError(null);

    try {
      const previousScript = panelScripts[index - 1] || '';
      const nextScript = panelScripts[index + 1] || '';
      const allContext = panelScripts.slice(0, index).filter(Boolean).join('\n');

      const response = await fetch('/api/generate-single-panel-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': userGeminiKey
        },
        body: JSON.stringify({
          image: manualImages[index],
          panelIndex: index,
          totalPanels: manualImages.length,
          previousScript,
          nextScript,
          allContext,
          style: manualStyle
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal membuat naskah panel.');

      const newScriptText = data.script || '';
      setPanelScripts(prev => {
        const copy = [...prev];
        copy[index] = newScriptText;
        return copy;
      });
    } catch (err: any) {
      setManualError(`Panel #${index + 1}: ${err.message || String(err)}`);
    } finally {
      setPanelLoading(prev => {
        const copy = [...prev];
        copy[index] = false;
        return copy;
      });
    }
  };

  // Generate Panel Voiceover (TTS)
  const handleGeneratePanelTTS = async (index: number) => {
    const text = panelScripts[index];
    if (!text || !text.trim()) {
      setManualError(`Panel #${index + 1}: Silakan tulis naskah panel terlebih dahulu sebelum membuat voiceover.`);
      return;
    }

    const selectedVoice = panelVoices[index] || 'id-ID-ArdiNeural';

    setPanelTtsLoading(prev => {
      const copy = [...prev];
      copy[index] = true;
      return copy;
    });
    setManualError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: selectedVoice })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.audioUrl) {
        throw new Error(data.error || 'Gagal memproses Voiceover TTS dari server.');
      }

      setPanelAudioUrls(prev => {
        const copy = [...prev];
        copy[index] = data.audioUrl;
        return copy;
      });
    } catch (err: any) {
      // Web Speech API client fallback
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'id-ID';
          window.speechSynthesis.speak(utterance);
          setManualError(`Gagal menghubungi server TTS, memutar melalui Suara Sistem Lokal: ${err.message || String(err)}`);
        } catch (sErr) {
          setManualError(`Panel #${index + 1} TTS: ${err.message || String(err)}`);
        }
      } else {
        setManualError(`Panel #${index + 1} TTS: ${err.message || String(err)}`);
      }
    } finally {
      setPanelTtsLoading(prev => {
        const copy = [...prev];
        copy[index] = false;
        return copy;
      });
    }
  };

  // Download Single Panel Image
  const handleDownloadSinglePanelImage = (index: number) => {
    const imgData = manualImages[index];
    if (!imgData) return;
    const a = document.createElement('a');
    a.href = imgData;
    a.download = `panel_${index + 1}.png`;
    a.click();
  };

  // Download All Panels as ZIP
  const handleDownloadPanelsZip = async () => {
    if (manualImages.length === 0) return;
    try {
      const zip = new JSZip();
      const folder = zip.folder("panel_komik") || zip;

      manualImages.forEach((img, idx) => {
        const base64Data = img.split(',')[1] || img;
        folder.file(`panel_${idx + 1}.png`, base64Data, { base64: true });
      });

      const combinedText = panelScripts.filter(Boolean).join('\n\n') || manualScriptResult;
      if (combinedText) {
        folder.file("naskah_lengkap.txt", combinedText);
      }

      const content = (await zip.generateAsync({ type: "blob" })) as Blob;
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `panel_komik_${manualImages.length}_gambar.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setManualError(`Gagal mengunduh ZIP: ${err.message || String(err)}`);
    }
  };

  // Handle Manga Script Generation
  const handleGenerateMangaScript = async () => {
    if (!userGeminiKey) {
      setShowSettingsModal(true);
      setKeyTestResult({ success: false, message: 'Silakan masukkan Kunci API Gemini Anda di bawah ini terlebih dahulu untuk menggunakan fitur AI.' });
      return;
    }
    if (mangaImages.length === 0) {
      setMangaError('Silakan unggah minimal 1 gambar panel manga.');
      return;
    }
    setMangaLoading(true);
    setMangaError(null);
    setMangaScriptResult('');

    try {
      const response = await fetch('/api/generate-manga-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': userGeminiKey
        },
        body: JSON.stringify({
          images: mangaImages,
          style: mangaStyle,
          wordCount: mangaWordCount,
          useHook: mangaHook,
          useOutro: mangaOutro
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menghasilkan naskah manga.');
      setMangaScriptResult(data.script || '');
    } catch (err: any) {
      setMangaError(err.message || String(err));
    } finally {
      setMangaLoading(false);
    }
  };

  // Handle TTS Generation
  const handleGenerateTTS = async (textToUse?: string) => {
    const text = textToUse || ttsText;
    if (!text || !text.trim()) {
      setTtsError('Masukkan teks narasi terlebih dahulu.');
      return;
    }
    setTtsLoading(true);
    setTtsError(null);
    setTtsAudioUrl(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: ttsVoice })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.audioUrl) {
        throw new Error(data.error || 'Gagal membuat suara TTS.');
      }

      setTtsAudioUrl(data.audioUrl);
    } catch (err: any) {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'id-ID';
          window.speechSynthesis.speak(utterance);
          setTtsError(`Gagal menghubungi server TTS, memutar melalui Suara Sistem Lokal: ${err.message || String(err)}`);
        } catch (_) {
          setTtsError(err.message || String(err));
        }
      } else {
        setTtsError(err.message || String(err));
      }
    } finally {
      setTtsLoading(false);
    }
  };

  // Handle Video Script Generation
  const handleGenerateVideoScript = async () => {
    if (!userGeminiKey) {
      setShowSettingsModal(true);
      setKeyTestResult({ success: false, message: 'Silakan masukkan Kunci API Gemini Anda di bawah ini terlebih dahulu untuk menggunakan fitur AI.' });
      return;
    }
    if (!videoIdea.trim()) {
      setVideoError('Masukkan ide / topik cerita terlebih dahulu.');
      return;
    }
    setVideoLoading(true);
    setVideoError(null);
    setVideoScriptResult('');

    try {
      const response = await fetch('/api/generate-video-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': userGeminiKey
        },
        body: JSON.stringify({
          idea: videoIdea,
          duration: videoDuration,
          platform: videoPlatform,
          tone: videoTone
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal membuat skrip video.');
      setVideoScriptResult(data.script || '');
    } catch (err: any) {
      setVideoError(err.message || String(err));
    } finally {
      setVideoLoading(false);
    }
  };

  // Download TXT helper
  const downloadTxt = (text: string, filename: string) => {
    const element = document.createElement('a');
    const file = new window.Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Copy to Clipboard helper
  const copyToClipboard = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bgClass = themeMode === 'dark' ? 'bg-[#0B0F17] text-gray-100' : 'bg-gray-50 text-gray-900';
  const cardClass = themeMode === 'dark' ? 'bg-[#151C2C] border-gray-800' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 pb-24 ${bgClass}`}>
      
      {/* ------------------ TOP NAVBAR ------------------ */}
      <header className={`sticky top-0 z-40 border-b px-4 py-3 ${themeMode === 'dark' ? 'bg-[#0B0F17]/90 border-gray-800 backdrop-blur-md' : 'bg-white/90 border-gray-200 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => setActiveTab('home')}
          >
            <img 
              src="/logo.jpg" 
              alt="Logo Komik AI" 
              className="w-10 h-10 rounded-xl object-cover border border-blue-500/30 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight flex items-center gap-2">
                Asisten Alur cerita komik
              </h1>
              <p className="text-[10px] font-semibold tracking-wider text-blue-500 uppercase">
                BERTENAGA GEMINI AI
              </p>
            </div>
          </div>

          {/* Quick Controls Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallPwa}
              className="p-2 md:px-3.5 md:py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-md shadow-blue-600/20 hover:scale-105"
              title="Unduh / Install Aplikasi (PWA)"
            >
              <Smartphone className="w-4 h-4 text-white animate-pulse" />
              <span className="hidden sm:inline">
                {isAppInstalled ? 'App Terinstall' : 'Unduh App'}
              </span>
            </button>

            <button
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                themeMode === 'dark' ? 'bg-[#151C2C] border-gray-700 hover:bg-gray-800 text-gray-200' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700'
              }`}
              title="Ganti Mode Tampilan"
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span className="hidden sm:inline">{themeMode === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                themeMode === 'dark' ? 'bg-[#151C2C] border-gray-700 hover:bg-gray-800 text-gray-200' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700'
              }`}
              title="Layar Penuh"
            >
              <Maximize className="w-4 h-4" />
              <span className="hidden sm:inline">Layar Penuh</span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                userGeminiKey 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse'
              }`}
              title="Pengaturan Kunci API"
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">
                {userGeminiKey ? 'API Key Aktif' : 'Atur API Key'}
              </span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                themeMode === 'dark' ? 'bg-[#151C2C] border-gray-700 hover:bg-gray-800 text-gray-200' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700'
              }`}
              title="Pengaturan"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Pengaturan</span>
            </button>

            <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
              themeMode === 'dark' ? 'bg-[#151C2C] border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'
            }`}>
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              ID
            </div>
          </div>

        </div>
      </header>

      {/* ------------------ MAIN CONTENT VIEW ------------------ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">

        {/* ---------------- TAB 1: BERANDA (HOME) ---------------- */}
        {activeTab === 'home' && (
          <div className="space-y-10 animate-fade-in">
            {/* Hero Banner with Logo & PWA Download Button */}
            <div className="text-center space-y-4 pt-4 pb-2 flex flex-col items-center">
              <div 
                className="relative group cursor-pointer"
                onClick={handleInstallPwa}
                title="Klik untuk Unduh / Install Aplikasi PWA"
              >
                <img 
                  src="/logo.jpg" 
                  alt="Logo Asisten Komik AI" 
                  className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-blue-500/40 shadow-2xl shadow-blue-500/30 group-hover:scale-105 transition-all duration-300"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold border border-blue-400 shadow flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> PWA READY
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Selamat Datang di <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Asisten Alur cerita komik</span>
              </h2>
              <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-400 leading-relaxed">
                Platform kreatif bertenaga AI untuk membantu kreator konten, penulis, dan penggemar komik mewujudkan imajinasi mereka secara instan dan tanpa batas.
              </p>

              {/* Install PWA Call to Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleInstallPwa}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs md:text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
                >
                  <Smartphone className="w-5 h-5 text-amber-300 animate-bounce" />
                  <span>{isAppInstalled ? 'Aplikasi Sudah Terinstall di Perangkat Anda' : 'Unduh & Install Aplikasi ke HP / Laptop'}</span>
                  <Download className="w-4 h-4 ml-1 opacity-80" />
                </button>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Asisten Manual */}
              <div className={`p-6 rounded-2xl border ${cardClass} flex flex-col justify-between group hover:border-blue-500/50 transition-all duration-300`}>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Asisten Manual</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Ubah gambar komik atau webtoon menjadi naskah narasi dan voiceover secara otomatis.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('manual')}
                  className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                  Mulai Sekarang <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card 2: Naskah Manga */}
              <div className={`p-6 rounded-2xl border ${cardClass} flex flex-col justify-between group hover:border-indigo-500/50 transition-all duration-300`}>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Naskah Manga</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Unggah panel-panel manga Anda dan biarkan AI merangkai naskah narasi yang mengalir santai.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('naskah')}
                  className="mt-6 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Mulai Sekarang <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card 3: Skrip Video */}
              <div className={`p-6 rounded-2xl border ${cardClass} flex flex-col justify-between group hover:border-purple-500/50 transition-all duration-300`}>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Generator Skrip Video</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Fitur baru untuk membantu Anda membuat skrip video pendek (TikTok/Reels) dari ide cerita sederhana.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('video-script')}
                  className="mt-6 w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
                >
                  Coba Fitur <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card 4: Fitur TTS */}
              <div className={`p-6 rounded-2xl border ${cardClass} flex flex-col justify-between group hover:border-emerald-500/50 transition-all duration-300`}>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Fitur TTS</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Ubah teks Anda menjadi suara narasi berkualitas tinggi secara instan dengan pilihan karakter beragam.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('tts')}
                  className="mt-6 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                >
                  Coba Fitur <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Tentang Platform Box */}
            <div className={`p-6 md:p-8 rounded-2xl border ${cardClass} space-y-3`}>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
                <Info className="w-4 h-4" />
                Tentang Platform
              </div>
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                Asisten Alur cerita komik dirancang untuk mempercepat workflow produksi konten berbasis cerita. Dengan integrasi Gemini AI terbaru, kami membantu Anda menghemat waktu berjam-jam dalam proses penulisan naskah dan penyuntingan voiceover.
              </p>
            </div>
          </div>
        )}

        {/* ---------------- TAB 2: MANUAL (ASISTEN MANUAL) ---------------- */}
        {activeTab === 'manual' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Asisten Alur Cerita Manual & Manga
              </h2>
              <p className="text-xs md:text-sm text-gray-400">
                Ubah gambar komik menjadi naskah narasi dan voiceover secara otomatis.
              </p>
            </div>

            {/* Langkah 1: Unggah Gambar Komik */}
            <div className={`p-8 rounded-2xl border ${cardClass} text-center space-y-4`}>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Langkah 1: Unggah Gambar Komik (Maksimal 200 gambar)</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Unggah satu gambar long strip atau banyak gambar panel komik (Maksimal 200).
                </p>
                <p className="text-[11px] text-emerald-400 font-medium mt-1">
                  ✓ Gambar terurut otomatis sesuai nama file (cth: image 1, image 2, image 3, dst.)
                </p>
              </div>
              
              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm cursor-pointer transition-colors shadow-lg shadow-emerald-600/20">
                <Plus className="w-4 h-4" /> Pilih Gambar
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleUploadManualImages} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* Options Bar: Gaya Narasi (Formal Default) */}
            {manualImages.length > 0 && (
              <div className={`p-4 rounded-xl border ${cardClass} flex items-center justify-between flex-wrap gap-3 text-xs`}>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Gaya Narasi Default:</span>
                  <button
                    type="button"
                    onClick={() => setManualStyle('baku')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors border ${manualStyle === 'baku' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                  >
                    Baku (Formal Sinematik)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualStyle('santai')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors border ${manualStyle === 'santai' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                  >
                    Santai (Slang)
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Total Panel: <strong className="text-blue-400">{manualImages.length}</strong></span>
                  <button 
                    onClick={handleClearAllPanels}
                    className="text-xs text-rose-400 hover:underline flex items-center gap-1 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua Panel
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {manualError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <span>{manualError}</span>
                <button onClick={() => setManualError(null)} className="text-rose-400 hover:text-rose-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Langkah 3: Tulis Naskah & VO */}
            {manualImages.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" /> Langkah 3: Tulis Naskah & VO
                  </h3>
                </div>

                {/* Top Action Buttons Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleGenerateManualScript}
                    disabled={manualLoading}
                    className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {manualLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Memproses Semua Panel dengan AI...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-4 h-4" /> ✂ Generate Semua Naskah
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCombineAllScripts}
                    className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> 🔲 Gabungkan Semua Naskah
                  </button>
                </div>

                {/* Per Panel Cards List */}
                <div className="space-y-4">
                  {manualImages.map((img, idx) => (
                    <div key={idx} className={`p-4 md:p-5 rounded-2xl border ${cardClass} space-y-4`}>
                      {/* Badge and actions */}
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold font-mono">
                          Panel #{idx + 1}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Panel Image & Image Actions Column */}
                        <div className="md:col-span-4 space-y-2">
                          <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-black/50 aspect-video md:aspect-square flex items-center justify-center">
                            <img src={img} alt={`Panel #${idx + 1}`} className="w-full h-full object-contain" />
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => handleDownloadSinglePanelImage(idx)}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center gap-1 transition-colors text-[11px]"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-400" /> Unduh Gambar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePanel(idx)}
                              className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center gap-1 transition-colors text-[11px]"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>
                        </div>

                        {/* Textarea & Panel Actions Column */}
                        <div className="md:col-span-8 space-y-3">
                          <textarea
                            rows={4}
                            value={panelScripts[idx] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPanelScripts(prev => {
                                const copy = [...prev];
                                copy[idx] = val;
                                return copy;
                              });
                            }}
                            placeholder="Tulis naskah atau klik tombol di bawah..."
                            className="w-full p-3 rounded-xl bg-gray-900/60 border border-gray-700 text-xs md:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
                          />

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleGenerateSinglePanelScript(idx)}
                              disabled={panelLoading[idx]}
                              className="flex-1 py-2 px-3 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {panelLoading[idx] ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menganalisis Panel...
                                </>
                              ) : (
                                <>
                                  <Scissors className="w-3.5 h-3.5" /> ✂ Buat Naskah Otomatis
                                </>
                              )}
                            </button>
                          </div>

                          {/* Voiceover Selection & Trigger Row */}
                          <div className="pt-2 border-t border-gray-800/80 flex items-center gap-2 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                              <select
                                value={panelVoices[idx] || 'id-ID-ArdiNeural'}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setPanelVoices(prev => {
                                    const copy = [...prev];
                                    copy[idx] = v;
                                    return copy;
                                  });
                                }}
                                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                              >
                                {VOICES.map(voice => (
                                  <option key={voice.value} value={voice.value}>
                                    {voice.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleGeneratePanelTTS(idx)}
                              disabled={panelTtsLoading[idx]}
                              title="Buat Voiceover TTS untuk Panel ini"
                              className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {panelTtsLoading[idx] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Volume2 className="w-4 h-4" /> 🔊
                                </>
                              )}
                            </button>
                          </div>

                          {/* Audio Player if generated */}
                          {panelAudioUrls[idx] && (
                            <div className="pt-1">
                              <audio key={panelAudioUrls[idx]!} controls src={panelAudioUrls[idx]!} className="w-full h-8 rounded-lg border border-gray-700" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Langkah 4: Ekspor Hasil */}
                <div className={`p-6 rounded-2xl border ${cardClass} space-y-4 mt-8`}>
                  <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
                    <Download className="w-5 h-5" /> Langkah 4: Ekspor Hasil
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        const text = panelScripts.filter(Boolean).join('\n\n') || manualScriptResult;
                        if (!text) {
                          setManualError('Tidak ada naskah untuk diunduh.');
                          return;
                        }
                        downloadTxt(text, 'naskah_alur_cerita_komik_manual.txt');
                      }}
                      className="py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium text-xs flex items-center justify-center gap-2 border border-gray-700 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" /> 📥 Unduh File Naskah (.txt)
                    </button>

                    <button
                      onClick={handleDownloadPanelsZip}
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-colors cursor-pointer"
                    >
                      <FileDown className="w-4 h-4" /> 🖼️ Unduh Semua Panel (ZIP)
                    </button>
                  </div>
                </div>

                {/* Combined Result Display if generated */}
                {manualScriptResult && (
                  <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                      <h4 className="font-bold text-sm flex items-center gap-2 text-blue-400">
                        <Sparkles className="w-4 h-4" /> Hasil Penggabungan Naskah Alur Cerita
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(manualScriptResult, setManualCopied)}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 flex items-center gap-1.5 transition-colors"
                        >
                          {manualCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {manualCopied ? 'Tersalin' : 'Salin'}
                        </button>
                        <button
                          onClick={() => downloadTxt(manualScriptResult, 'naskah_alur_cerita_komik.txt')}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Unduh TXT
                        </button>
                        <button
                          onClick={() => {
                            setTtsText(manualScriptResult);
                            setActiveTab('tts');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> Ke TTS
                        </button>
                      </div>
                    </div>

                    <div className="text-xs md:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2">
                      {manualScriptResult}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 3: NASKAH (MULTI-PANEL MANGA SCRIPT) ---------------- */}
        {activeTab === 'naskah' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Multi-Panel <span className="text-blue-400">Manga Script</span>
              </h2>
              <p className="text-xs md:text-sm text-gray-400">
                Unggah panel-panel manga Anda dan biarkan AI merangkai naskah narasi yang mengalir santai.
              </p>
            </div>

            {/* Upload Area */}
            <div className={`p-8 rounded-2xl border ${cardClass} text-center space-y-4`}>
              <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Pilih Gambar Panel Manga</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Pilih beberapa gambar panel sekaligus (Maksimal 200). Urutan baca akan disesuaikan (Kanan ke Kiri).
                </p>
                <p className="text-[11px] text-blue-400 font-medium mt-1">
                  ✓ Gambar terurut otomatis sesuai nama file (cth: image 1, image 2, image 3, dst.)
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm cursor-pointer transition-colors shadow-lg shadow-blue-600/20">
                <Plus className="w-4 h-4" /> Pilih Gambar (Maks 200)
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, setMangaImages)} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* Preview Panel Grid */}
            {mangaImages.length > 0 && (
              <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm">Panel Terunggah ({mangaImages.length})</h4>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-400 uppercase">
                      GAYA: SANTAI & RTL
                    </span>
                  </div>
                  <button 
                    onClick={() => setMangaImages([])}
                    className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {mangaImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-700 aspect-square bg-black/40">
                      <img src={img} alt={`Panel ${idx+1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">
                        {idx + 1}
                      </span>
                      <button
                        onClick={() => setMangaImages(mangaImages.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-rose-600/80 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Additional Settings Controls */}
                <div className="pt-4 border-t border-gray-800 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium cursor-pointer ${mangaHook ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-800/40 border-gray-700 text-gray-400'}`}>
                      <input 
                        type="checkbox" 
                        checked={mangaHook} 
                        onChange={(e) => setMangaHook(e.target.checked)} 
                        className="rounded accent-blue-500" 
                      />
                      Pakai Hook Pembuka
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium cursor-pointer ${mangaOutro ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-800/40 border-gray-700 text-gray-400'}`}>
                      <input 
                        type="checkbox" 
                        checked={mangaOutro} 
                        onChange={(e) => setMangaOutro(e.target.checked)} 
                        className="rounded accent-blue-500" 
                      />
                      Pakai Penutup
                    </label>
                  </div>

                  {/* Slider Length */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Panjang Target (Kata)</span>
                      <span className="font-bold text-blue-400">{mangaWordCount} Kata</span>
                    </div>
                    <input 
                      type="range" 
                      min="500" 
                      max="5000" 
                      step="250" 
                      value={mangaWordCount} 
                      onChange={(e) => setMangaWordCount(Number(e.target.value))} 
                      className="w-full accent-blue-500 cursor-pointer" 
                    />
                  </div>

                  {/* Narrative Style */}
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Gaya Narasi</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMangaStyle('baku')}
                        className={`py-2 text-xs font-medium rounded-lg border transition-colors ${mangaStyle === 'baku' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800/50 border-gray-700 text-gray-400'}`}
                      >
                        Baku (Formal)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMangaStyle('santai')}
                        className={`py-2 text-xs font-medium rounded-lg border transition-colors ${mangaStyle === 'santai' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800/50 border-gray-700 text-gray-400'}`}
                      >
                        Santai (Slang)
                      </button>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleGenerateMangaScript}
                    disabled={mangaLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {mangaLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Merangkai Naskah Manga...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" /> Hasilkan Naskah Alur Cerita
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {mangaError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {mangaError}
              </div>
            )}

            {/* Result Box */}
            {mangaScriptResult && (
              <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h4 className="font-bold text-sm flex items-center gap-2 text-blue-400">
                    <Sparkles className="w-4 h-4" /> Hasil Naskah Manga
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(mangaScriptResult, setMangaCopied)}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 flex items-center gap-1.5 transition-colors"
                    >
                      {mangaCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {mangaCopied ? 'Tersalin' : 'Salin'}
                    </button>
                    <button
                      onClick={() => downloadTxt(mangaScriptResult, 'naskah_manga_script.txt')}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh TXT
                    </button>
                    <button
                      onClick={() => {
                        setTtsText(mangaScriptResult);
                        setActiveTab('tts');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Ke TTS
                    </button>
                  </div>
                </div>

                <div className="text-xs md:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2">
                  {mangaScriptResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 4: TTS (TEXT TO SPEECH) ---------------- */}
        {activeTab === 'tts' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Fitur <span className="text-blue-400">Text to Speech</span>
              </h2>
              <p className="text-xs md:text-sm text-gray-400">
                Ubah teks Anda menjadi suara narasi berkualitas tinggi secara instan.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${cardClass} space-y-5`}>
              {/* Text Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <label className="font-semibold text-gray-200">Teks Narasi</label>
                  <span>{ttsText.length}/50000</span>
                </div>
                <textarea
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="Masukkan teks yang ingin diubah menjadi suara di sini..."
                  className="w-full h-44 p-4 rounded-xl bg-gray-900/60 border border-gray-700 focus:border-blue-500 focus:outline-none text-xs md:text-sm text-gray-200 leading-relaxed resize-none"
                />
              </div>

              {/* Voice Character Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-200">Pilih Karakter Suara</label>
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-900/60 border border-gray-700 text-xs md:text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                >
                  {VOICES.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => handleGenerateTTS()}
                disabled={ttsLoading || !ttsText.trim()}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                {ttsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Mengubah Teks ke Suara...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" /> Hasilkan Suara
                  </>
                )}
              </button>

              {/* Audio Output Result */}
              {ttsAudioUrl && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Audio Narasi Siap
                    </span>
                    <a
                      href={ttsAudioUrl}
                      download="narasi_suara.mp3"
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh MP3
                    </a>
                  </div>
                  <audio ref={audioRef} key={ttsAudioUrl} src={ttsAudioUrl} controls className="w-full h-10 accent-emerald-500" />
                </div>
              )}

              {ttsError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {ttsError}
                </div>
              )}
            </div>

            {/* Tips Penggunaan */}
            <div className={`p-6 rounded-2xl border ${cardClass} space-y-3`}>
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                <Info className="w-4 h-4" /> Tips Penggunaan TTS
              </div>
              <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside leading-relaxed">
                <li>Gunakan tanda baca yang tepat (koma, titik) untuk intonasi yang lebih natural.</li>
                <li>Pilihan Suara Laki-laki: <b>Ardi</b> (Indonesian Natural) & <b>Andrew</b> (Laki-laki Karismatik).</li>
                <li>Pilihan Suara Perempuan: <b>Gadis</b> (Indonesian Natural) & <b>Ava</b> (Perempuan Lembut).</li>
                <li>Batas maksimal teks adalah 50.000 karakter per sesi generasi.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ---------------- TAB 5: SKRIP VIDEO SHORT / REELS ---------------- */}
        {activeTab === 'video-script' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Generator Skrip <span className="text-purple-400">Video Short / Reels</span>
              </h2>
              <p className="text-xs md:text-sm text-gray-400">
                Fitur baru untuk membantu Anda membuat skrip video pendek dari ide cerita sederhana.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
              {/* Input Idea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-200">Ide / Topik Cerita Utama</label>
                <textarea
                  value={videoIdea}
                  onChange={(e) => setVideoIdea(e.target.value)}
                  placeholder="Contoh: Karakter utama dikhianati oleh klannya namun mendapatkan kekuatan dewa naga kegelapan..."
                  className="w-full h-28 p-3 rounded-xl bg-gray-900/60 border border-gray-700 focus:border-purple-500 focus:outline-none text-xs md:text-sm text-gray-200 leading-relaxed resize-none"
                />
              </div>

              {/* Grid Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Durasi Target</label>
                  <select
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-gray-900/60 border border-gray-700 text-xs text-gray-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="15 Detik">15 Detik</option>
                    <option value="30 Detik">30 Detik</option>
                    <option value="60 Detik">60 Detik</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Platform</label>
                  <select
                    value={videoPlatform}
                    onChange={(e) => setVideoPlatform(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-gray-900/60 border border-gray-700 text-xs text-gray-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="TikTok / Reels">TikTok / Reels</option>
                    <option value="YouTube Shorts">YouTube Shorts</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Nada Bicara</label>
                  <select
                    value={videoTone}
                    onChange={(e) => setVideoTone(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-gray-900/60 border border-gray-700 text-xs text-gray-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Dramatis & Epik">Dramatis & Epik</option>
                    <option value="Humoris & Santai">Humoris & Santai</option>
                    <option value="Misterius & Mencekam">Misterius & Mencekam</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleGenerateVideoScript}
                disabled={videoLoading || !videoIdea.trim()}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                {videoLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Merancang Skrip Video Short...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" /> Hasilkan Skrip Video
                  </>
                )}
              </button>

              {videoError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {videoError}
                </div>
              )}

              {/* Result Display */}
              {videoScriptResult && (
                <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-700 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <h4 className="font-bold text-xs text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Skrip Video Terbentuk
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(videoScriptResult, setVideoCopied)}
                        className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 flex items-center gap-1"
                      >
                        {videoCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {videoCopied ? 'Tersalin' : 'Salin'}
                      </button>
                      <button
                        onClick={() => downloadTxt(videoScriptResult, 'skrip_video_short.txt')}
                        className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Unduh
                      </button>
                    </div>
                  </div>

                  <div className="text-xs md:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto pr-1">
                    {videoScriptResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ---------------- FIXED BOTTOM NAVIGATION BAR ---------------- */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t ${themeMode === 'dark' ? 'bg-[#0B0F17]/95 border-gray-800 backdrop-blur-md' : 'bg-white/95 border-gray-200 backdrop-blur-md'}`}>
        <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-2">
          
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
              activeTab === 'home' ? 'text-blue-500 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span>Beranda</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
              activeTab === 'manual' ? 'text-blue-500 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Scissors className="w-5 h-5" />
            <span>Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('naskah')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
              activeTab === 'naskah' ? 'text-blue-500 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Naskah</span>
          </button>

          <button
            onClick={() => setActiveTab('tts')}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
              activeTab === 'tts' ? 'text-blue-500 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Volume2 className="w-5 h-5" />
            <span>TTS</span>
          </button>

        </div>
      </nav>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="mt-12 text-center text-xs text-gray-500 space-y-2 py-6 border-t border-gray-800/50">
        <p className="font-medium text-gray-400">Terima kasih telah berkunjung</p>
        <div className="flex items-center justify-center gap-1 text-blue-400 hover:underline cursor-pointer">
          <Play className="w-3 h-3 fill-current" />
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            YouTube: Anime Kingdom ID
          </a>
        </div>
        <p className="text-[10px] text-gray-600">
          © 2026 Asisten Alur cerita komik • Made with ❤️ and Gemini AI
        </p>
      </footer>

      {/* ---------------- SETTINGS MODAL ---------------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${cardClass} space-y-5 relative max-h-[90vh] overflow-y-auto`}>
            
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Kunci API Gemini Pengguna</h3>
                <p className="text-xs text-gray-400">Diperlukan untuk memproses fitur AI secara gratis</p>
              </div>
            </div>

            {/* Instruction Guide Box */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-2 text-blue-200">
              <div className="font-semibold flex items-center gap-1.5 text-blue-300">
                <Key className="w-4 h-4" /> Cara Mendapatkan Kunci API Gratis:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-300">
                <li>Buka Google AI Studio melalui tombol di bawah.</li>
                <li>Login dengan akun Google Anda.</li>
                <li>Klik tombol <strong>"Create API key"</strong>.</li>
                <li>Salin kunci yang didapat, lalu tempel di kolom bawah ini.</li>
              </ol>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors mt-1"
              >
                Dapatkan Key Gratis di Google AI Studio <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Tempel Kunci API Gemini Anda:</label>
                <input
                  type="password"
                  value={keyInputTemp}
                  onChange={(e) => setKeyInputTemp(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full p-3 rounded-xl bg-gray-900 border border-gray-700 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSaveGeminiKey}
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> Simpan Kunci
                </button>
                <button
                  onClick={handleDeleteGeminiKey}
                  className="py-2.5 rounded-xl bg-gray-800 hover:bg-rose-600/80 text-gray-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Kunci
                </button>
              </div>

              <button
                onClick={handleTestGeminiKey}
                disabled={keyTestLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600/50 text-indigo-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {keyTestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Uji Koneksi Kunci API
              </button>

              {keyTestResult && (
                <div className={`p-3 rounded-xl border text-xs ${keyTestResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                  {keyTestResult.message}
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-500 text-center">
              🔒 Kunci API Anda disimpan secara lokal di browser Anda (LocalStorage) dan tidak akan pernah disimpan di database server kami.
            </p>

          </div>
        </div>
      )}

      {/* ------------------ PWA INSTALLATION MODAL ------------------ */}
      {showPwaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl space-y-5 relative ${cardClass}`}>
            <button
              onClick={() => setShowPwaModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpg" 
                alt="Logo App" 
                className="w-12 h-12 rounded-xl object-cover border border-blue-500/40 shadow-lg shadow-blue-500/20"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-bold text-base flex items-center gap-1.5 text-white">
                  <Smartphone className="w-4 h-4 text-blue-400" /> Install Aplikasi PWA
                </h3>
                <p className="text-xs text-gray-400">Asisten Alur Cerita Komik AI</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                <p className="font-semibold text-blue-300">💡 Cara Menginstall di Smartphone & Laptop:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-300">
                  <li><strong>Android / Chrome:</strong> Klik tombol opsi browser (titik tiga ⋮) di sudut kanan atas → Pilih <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                  <li><strong>iOS / Safari (iPhone/iPad):</strong> Klik tombol <strong>Share (Bagikan)</strong> di bagian bawah layar Safari → Pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
                  <li><strong>Desktop / PC:</strong> Klik ikon install ⊕ di bilah alamat browser (URL bar) atau buka menu browser → <strong>Instal Asisten Komik AI</strong>.</li>
                </ul>
              </div>

              <p className="text-[11px] text-emerald-400 font-medium">
                ✓ Aplikasi akan terpasang layaknya aplikasi native tanpa memerlukan instalasi Play Store/App Store.
              </p>
            </div>

            <button
              onClick={() => setShowPwaModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
