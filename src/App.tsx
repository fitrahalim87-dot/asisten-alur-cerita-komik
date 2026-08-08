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
  Smartphone,
  User,
  Lock,
  ShieldCheck,
  Clock,
  AlertTriangle
} from 'lucide-react';

const VOICES = [
  { name: 'Ardi - Laki-laki Natural (id-ID-ArdiNeural)', value: 'id-ID-ArdiNeural' },
  { name: 'Andrew - Laki-laki Karismatik (en-US-AndrewNeural)', value: 'en-US-AndrewNeural' },
  { name: 'Gadis - Perempuan Natural (id-ID-GadisNeural)', value: 'id-ID-GadisNeural' },
  { name: 'Ava - Perempuan Lembut (en-US-AvaNeural)', value: 'en-US-AvaNeural' }
];

export interface AppLicenseRecord {
  key: string;
  buyerName: string;
  type: 'VIP Lifetime' | 'Akses 30 Hari' | 'Akses 1 Tahun' | 'Akses 1 Jam';
  durationMs: number | null;
  createdAt: number;
  expiresAt: number | null;
}

export interface ActiveAppLicense {
  key: string;
  buyerName: string;
  type: string;
  activatedAt: string;
  activatedTimestamp: number;
  expiresAt: number | null;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'manual' | 'naskah' | 'tts' | 'video-script'>('home');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // WhatsApp License Key System State & Constants
  const ADMIN_WA_LINK = `https://wa.me/6282259652587?text=${encodeURIComponent('Halo Admin Komik AI, saya ingin membeli/meminta Kode Lisensi untuk akses aplikasi. Mohon petunjuk pembayaran dan cara aktivasi.')}`;

  // Time ticker for live countdowns & auto expiration checks
  const [nowTicker, setNowTicker] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTicker(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [registeredLicenses, setRegisteredLicenses] = useState<AppLicenseRecord[]>(() => {
    const saved = localStorage.getItem('registered_licenses_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [];
  });

  const [activeLicense, setActiveLicense] = useState<ActiveAppLicense | null>(() => {
    const saved = localStorage.getItem('active_app_license');
    if (saved) {
      try { 
        const parsed: ActiveAppLicense = JSON.parse(saved);
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          localStorage.removeItem('active_app_license');
          return null;
        }
        return parsed; 
      } catch (e) { return null; }
    }
    return null;
  });

  const [inputLicenseKey, setInputLicenseKey] = useState('');
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [licenseSuccess, setLicenseSuccess] = useState<string | null>(null);
  const [showLicenseGateModal, setShowLicenseGateModal] = useState(false);
  
  // Admin Key Generator Drawer / Modal
  const [showAdminGeneratorModal, setShowAdminGeneratorModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [genLicenseType, setGenLicenseType] = useState<'VIP Lifetime' | 'Akses 30 Hari' | 'Akses 1 Tahun' | 'Akses 1 Jam'>('VIP Lifetime');
  const [genBuyerName, setGenBuyerName] = useState('');
  const [generatedKeyResult, setGeneratedKeyResult] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<AppLicenseRecord | null>(null);
  const [deleteConfirmExpiredModal, setDeleteConfirmExpiredModal] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Auto Expire License Check Hook
  useEffect(() => {
    if (activeLicense && activeLicense.expiresAt !== null) {
      if (Date.now() > activeLicense.expiresAt) {
        localStorage.removeItem('active_app_license');
        setActiveLicense(null);
        setLicenseError('Masa berlaku Lisensi Anda telah habis. Silakan masukkan Kode Lisensi baru.');
        setShowLicenseGateModal(true);
      }
    }
  }, [nowTicker, activeLicense]);

  // Open License Modal automatically if user has no active license
  useEffect(() => {
    if (!activeLicense) {
      setShowLicenseGateModal(true);
    }
  }, [activeLicense]);

  // Format Remaining Time Function
  const getRemainingTimeString = (expiresAt: number | null) => {
    if (expiresAt === null) return 'VIP Lifetime (Selamanya)';
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'KADALUARSA (HABIS)';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days} Hari ${hours} Jam ${minutes} Mnt`;
    if (hours > 0) return `${hours} Jam ${minutes} Mnt ${seconds} Detik`;
    return `${minutes} Mnt ${seconds} Detik`;
  };

  const validateAndActivateKey = (keyToTest: string) => {
    const cleanKey = keyToTest.trim().toUpperCase();
    if (!cleanKey) {
      setLicenseError('Mohon masukkan Kode Lisensi terlebih dahulu.');
      return false;
    }

    // Search in registered list
    const found = registeredLicenses.find(l => l.key.toUpperCase() === cleanKey);
    let type: 'VIP Lifetime' | 'Akses 30 Hari' | 'Akses 1 Tahun' | 'Akses 1 Jam' = 'VIP Lifetime';
    let durationMs: number | null = null;
    let buyerName = 'Pengguna Lisensi';

    if (found) {
      type = found.type;
      durationMs = found.durationMs;
      buyerName = found.buyerName;
    } else {
      setLicenseError('Kode Lisensi tidak ditemukan atau belum dibuat oleh Admin. Silakan hubungi Admin via WhatsApp.');
      setLicenseSuccess(null);
      return false;
    }

    const now = Date.now();
    const expiresAt = durationMs ? now + durationMs : null;

    const activeObj: ActiveAppLicense = {
      key: cleanKey,
      buyerName: buyerName,
      type: type,
      activatedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      activatedTimestamp: now,
      expiresAt: expiresAt
    };

    localStorage.setItem('active_app_license', JSON.stringify(activeObj));
    setActiveLicense(activeObj);
    setLicenseSuccess('Lisensi Berhasil Diaktifkan! Seluruh fitur aplikasi kini terbuka.');
    setLicenseError(null);
    setTimeout(() => {
      setLicenseSuccess(null);
      setShowLicenseGateModal(false);
    }, 1500);
    return true;
  };

  const handleDeactivateLicense = () => {
    localStorage.removeItem('active_app_license');
    setActiveLicense(null);
    setLicenseSuccess('Lisensi telah dicabut dari perangkat ini.');
    setTimeout(() => setLicenseSuccess(null), 1500);
  };

  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.trim() === '2587') {
      setIsAdminUnlocked(true);
      setAdminPinError(null);
    } else {
      setAdminPinError('PIN Admin salah. Masukkan PIN yang benar.');
    }
  };

  const handleGenerateNewKey = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    let prefix = 'KOMIK-VIP-';
    let durationMs: number | null = null;

    if (genLicenseType === 'Akses 30 Hari') {
      prefix = 'KOMIK-MON-';
      durationMs = 30 * 24 * 3600 * 1000;
    } else if (genLicenseType === 'Akses 1 Tahun') {
      prefix = 'KOMIK-PRO-';
      durationMs = 365 * 24 * 3600 * 1000;
    } else if (genLicenseType === 'Akses 1 Jam') {
      prefix = 'KOMIK-PREVIEW-';
      durationMs = 3600 * 1000;
    }

    const newKey = `${prefix}${randomSuffix}`;
    const newRecord: AppLicenseRecord = {
      key: newKey,
      buyerName: genBuyerName.trim() || 'Pembeli WA',
      type: genLicenseType,
      durationMs: durationMs,
      createdAt: Date.now(),
      expiresAt: durationMs ? Date.now() + durationMs : null
    };

    const updated = [newRecord, ...registeredLicenses];
    setRegisteredLicenses(updated);
    localStorage.setItem('registered_licenses_v3', JSON.stringify(updated));
    setGeneratedKeyResult(newKey);
  };

  const handleDeleteRegisteredLicense = (keyToDelete: string) => {
    const target = registeredLicenses.find(l => l.key === keyToDelete);
    if (target) {
      setDeleteConfirmTarget(target);
    }
  };

  const executeDeleteSingleLicense = () => {
    if (!deleteConfirmTarget) return;
    const updated = registeredLicenses.filter(l => l.key !== deleteConfirmTarget.key);
    setRegisteredLicenses(updated);
    localStorage.setItem('registered_licenses_v3', JSON.stringify(updated));
    setDeleteConfirmTarget(null);
  };

  const handleDeleteExpiredLicenses = () => {
    setDeleteConfirmExpiredModal(true);
  };

  const executeDeleteExpiredLicenses = () => {
    const updated = registeredLicenses.filter(l => !l.expiresAt || Date.now() < l.expiresAt);
    setRegisteredLicenses(updated);
    localStorage.setItem('registered_licenses_v3', JSON.stringify(updated));
    setDeleteConfirmExpiredModal(false);
  };

  const handleExportLicensesJSON = () => {
    if (registeredLicenses.length === 0) {
      alert('Belum ada data lisensi terdaftar untuk diekspor.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(registeredLicenses, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_lisensi_komik_ai_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportLicensesCSV = () => {
    if (registeredLicenses.length === 0) {
      alert('Belum ada data lisensi terdaftar untuk diekspor.');
      return;
    }
    const headers = ["Kode Lisensi", "Nama Pembeli", "Jenis Lisensi", "Tanggal Dibuat", "Tanggal Kadaluarsa", "Status"];
    const rows = registeredLicenses.map(item => {
      const isExpired = item.expiresAt ? (Date.now() > item.expiresAt ? "KADALUARSA" : "AKTIF") : "LIFETIME";
      const createdStr = item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-';
      const expiresStr = item.expiresAt ? new Date(item.expiresAt).toLocaleString('id-ID') : 'Selamanya';
      return [
        `"${item.key.replace(/"/g, '""')}"`,
        `"${(item.buyerName || '').replace(/"/g, '""')}"`,
        `"${item.type}"`,
        `"${createdStr}"`,
        `"${expiresStr}"`,
        `"${isExpired}"`
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `backup_lisensi_komik_ai_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Multi-Provider & API Key User Settings
  const [userGeminiKey, setUserGeminiKey] = useState<string>(() => {
    return localStorage.getItem('user_gemini_api_key') || '';
  });
  const [userAiProvider, setUserAiProvider] = useState<string>(() => {
    return localStorage.getItem('user_ai_provider') || 'gemini';
  });
  const [userCustomEndpoint, setUserCustomEndpoint] = useState<string>(() => {
    return localStorage.getItem('user_custom_endpoint') || '';
  });
  const [userCustomModel, setUserCustomModel] = useState<string>(() => {
    return localStorage.getItem('user_custom_model') || '';
  });

  const [keyInputTemp, setKeyInputTemp] = useState(userGeminiKey);
  const [providerTemp, setProviderTemp] = useState(userAiProvider);
  const [customEndpointTemp, setCustomEndpointTemp] = useState(userCustomEndpoint);
  const [customModelTemp, setCustomModelTemp] = useState(userCustomModel);

  const [keyTestLoading, setKeyTestLoading] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'x-gemini-api-key': userGeminiKey,
    'x-api-key': userGeminiKey,
    'x-ai-provider': userAiProvider,
    'x-custom-endpoint': userCustomEndpoint,
    'x-custom-model': userCustomModel,
  });

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

  // Save API Key & Provider
  const handleSaveGeminiKey = () => {
    const cleanedKey = keyInputTemp.trim();
    localStorage.setItem('user_gemini_api_key', cleanedKey);
    localStorage.setItem('user_ai_provider', providerTemp);
    localStorage.setItem('user_custom_endpoint', customEndpointTemp.trim());
    localStorage.setItem('user_custom_model', customModelTemp.trim());

    setUserGeminiKey(cleanedKey);
    setUserAiProvider(providerTemp);
    setUserCustomEndpoint(customEndpointTemp.trim());
    setUserCustomModel(customModelTemp.trim());

    const providerLabel = providerTemp === 'groq' ? 'Groq AI' : providerTemp === 'kie' ? 'Kie AI' : 'Gemini AI';
    setKeyTestResult({ success: true, message: `Kunci API Provider (${providerLabel}) berhasil disimpan!` });
  };

  // Delete API Key
  const handleDeleteGeminiKey = () => {
    localStorage.removeItem('user_gemini_api_key');
    localStorage.removeItem('user_ai_provider');
    localStorage.removeItem('user_custom_endpoint');
    localStorage.removeItem('user_custom_model');

    setUserGeminiKey('');
    setUserAiProvider('gemini');
    setUserCustomEndpoint('');
    setUserCustomModel('');

    setKeyInputTemp('');
    setProviderTemp('gemini');
    setCustomEndpointTemp('');
    setCustomModelTemp('');
    setKeyTestResult(null);
  };

  // Test API Key
  const handleTestGeminiKey = async () => {
    const testKey = keyInputTemp.trim();
    if (!testKey) {
      setKeyTestResult({ success: false, message: 'Masukkan Kunci API terlebih dahulu!' });
      return;
    }
    setKeyTestLoading(true);
    setKeyTestResult(null);
    try {
      const response = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: testKey,
          provider: providerTemp,
          customEndpoint: customEndpointTemp.trim(),
          customModel: customModelTemp.trim()
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menghubungi server pengujian.");

      if (data.success && data.text) {
        setKeyTestResult({ success: true, message: `Koneksi berhasil! ${data.text.trim()}` });
      } else {
        setKeyTestResult({ success: false, message: 'Kunci valid tetapi tidak mengembalikan teks.' });
      }
    } catch (err: any) {
      setKeyTestResult({ success: false, message: `Koneksi gagal: ${err.message || String(err)}` });
    } finally {
      setKeyTestLoading(false);
    }
  };

  // Helper to read & compress image file as Data URL using Canvas client-side
  const compressImageFile = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => resolve((evt.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Scale down proportionally if image dimensions exceed maximum threshold
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve((e.target?.result as string) || '');
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };

        img.onerror = () => {
          resolve((e.target?.result as string) || '');
        };

        img.src = (e.target?.result as string) || '';
      };

      reader.onerror = () => resolve('');
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
      const loadedDataUrls = await Promise.all(sortedFiles.map(file => compressImageFile(file)));
      const validDataUrls = loadedDataUrls.filter(Boolean);
      if (validDataUrls.length > 0) {
        setter(prev => [...prev, ...validDataUrls]);
      }
    } catch (err) {
      console.error("Gagal kompresi & membaca file gambar:", err);
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
      const loadedDataUrls = await Promise.all(sortedFiles.map(file => compressImageFile(file)));
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
      console.error("Gagal kompresi & membaca file gambar manual:", err);
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
      setKeyTestResult({ success: false, message: 'Silakan masukkan Kunci API Anda di Pengaturan terlebih dahulu untuk menggunakan fitur AI.' });
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
        headers: getAuthHeaders(),
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
      setKeyTestResult({ success: false, message: 'Silakan masukkan Kunci API Anda di Pengaturan terlebih dahulu untuk menggunakan fitur AI.' });
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
        headers: getAuthHeaders(),
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
      setKeyTestResult({ success: false, message: 'Silakan masukkan Kunci API Anda di Pengaturan terlebih dahulu untuk menggunakan fitur AI.' });
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
        headers: getAuthHeaders(),
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
      setKeyTestResult({ success: false, message: 'Silakan masukkan Kunci API Anda di Pengaturan terlebih dahulu untuk menggunakan fitur AI.' });
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
        headers: getAuthHeaders(),
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
  const cardClass = themeMode === 'dark' ? 'bg-[#151C2C] border-gray-800 text-gray-100' : 'bg-white border-gray-200 text-gray-900 shadow-sm';
  const textMuted = themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const textSubtle = themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700';
  const textHeading = themeMode === 'dark' ? 'text-white' : 'text-gray-900';
  const themeHeading = textHeading;
  const inputClass = themeMode === 'dark' 
    ? 'bg-gray-900/80 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-blue-500' 
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white';
  const selectClass = themeMode === 'dark' 
    ? 'bg-gray-900/80 border-gray-700 text-gray-100' 
    : 'bg-white border-gray-300 text-gray-900';

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
              src="/logo.png" 
              alt="Logo Komik AI" 
              className="w-10 h-10 rounded-xl object-cover border border-blue-500/30 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.jpg'; }}
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
              className={`relative p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
                !userGeminiKey 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold animate-pulse ring-2 ring-amber-500/30' 
                  : themeMode === 'dark' ? 'bg-[#151C2C] border-gray-700 hover:bg-gray-800 text-gray-200' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700'
              }`}
              title="Pengaturan & API Key Provider"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Pengaturan</span>
              {!userGeminiKey && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping absolute -top-1 -right-1" />
              )}
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

      {/* ⚠️ Warning Banner when API Key is missing */}
      {!userGeminiKey && (
        <div className="bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-rose-600/20 border-b border-amber-500/40 px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md sticky top-[65px] z-30">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </span>
            <span>
              <strong>Peringatan: Kunci API AI Belum Terpasang!</strong> Masukkan Kunci API Anda (Gemini, Groq, Kimi/OpenAI) di menu Pengaturan agar AI dapat memproses naskah & alur cerita secara otomatis.
            </span>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 hover:scale-105 shrink-0 flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Atur API Key Sekarang</span>
          </button>
        </div>
      )}

      {/* ------------------ MAIN CONTENT VIEW ------------------ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">

        {/* ---------------- TAB 1: BERANDA (HOME) ---------------- */}
        {activeTab === 'home' && (
          <div className="space-y-10 animate-fade-in">
            {/* Hero Banner */}
            <div className="text-center space-y-3 pt-2 pb-2 flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Selamat Datang di <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Asisten Alur cerita komik</span>
              </h2>
              <p className={`max-w-2xl mx-auto text-sm md:text-base ${textMuted} leading-relaxed`}>
                Platform kreatif bertenaga AI untuk membantu kreator konten, penulis, dan penggemar komik mewujudkan imajinasi mereka secara instan dan tanpa batas.
              </p>

              {/* WhatsApp License Banner (Only if not active) */}
              {!activeLicense && (
                <div className={`mt-2 max-w-xl mx-auto p-2.5 rounded-xl border ${cardClass} flex items-center justify-between gap-3 text-left shadow-md ${themeMode === 'dark' ? 'bg-amber-950/30 border-amber-500/30' : 'bg-amber-50 border-amber-300'}`}>
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <h4 className={`text-xs font-bold ${themeMode === 'dark' ? 'text-amber-300' : 'text-amber-900'}`}>
                        Belum Berlisensi
                      </h4>
                      <p className={`text-[11px] ${textSubtle}`}>
                        Aktivasi kode via <a href={ADMIN_WA_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">WhatsApp Admin</a>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLicenseGateModal(true)}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                  >
                    Aktivasi
                  </button>
                </div>
              )}
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Asisten Manual */}
              <div className={`p-6 rounded-2xl border ${cardClass} flex flex-col justify-between group hover:border-blue-500/50 transition-all duration-300`}>
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Asisten Manual</h3>
                    <p className={`text-xs ${textMuted} leading-relaxed`}>
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
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Naskah Manga</h3>
                    <p className={`text-xs ${textMuted} leading-relaxed`}>
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
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Generator Skrip Video</h3>
                    <p className={`text-xs ${textMuted} leading-relaxed`}>
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
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Fitur TTS</h3>
                    <p className={`text-xs ${textMuted} leading-relaxed`}>
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
              <div className="flex items-center gap-2 text-blue-500 font-semibold text-sm">
                <Info className="w-4 h-4" />
                Tentang Platform
              </div>
              <p className={`text-xs md:text-sm ${textMuted} leading-relaxed`}>
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
              <p className={`text-xs md:text-sm ${textMuted}`}>
                Ubah gambar komik menjadi naskah narasi dan voiceover secara otomatis.
              </p>
            </div>

            {/* Langkah 1: Unggah Gambar Komik */}
            <div className={`p-8 rounded-2xl border ${cardClass} text-center space-y-4`}>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Langkah 1: Unggah Gambar Komik (Maksimal 200 gambar)</h3>
                <p className={`text-xs ${textMuted} mt-1`}>
                  Unggah satu gambar long strip atau banyak gambar panel komik (Maksimal 200).
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
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
                  <span className={`${textMuted} font-medium`}>Gaya Narasi Default:</span>
                  <button
                    type="button"
                    onClick={() => setManualStyle('baku')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors border ${manualStyle === 'baku' ? 'bg-blue-600 border-blue-500 text-white' : (themeMode === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200')}`}
                  >
                    Baku (Formal Sinematik)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualStyle('santai')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors border ${manualStyle === 'santai' ? 'bg-blue-600 border-blue-500 text-white' : (themeMode === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200')}`}
                  >
                    Santai (Slang)
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={textMuted}>Total Panel: <strong className="text-blue-500">{manualImages.length}</strong></span>
                  <button 
                    onClick={handleClearAllPanels}
                    className="text-xs text-rose-500 hover:underline flex items-center gap-1 ml-2"
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
                        <span className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
                          Panel #{idx + 1}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Panel Image & Image Actions Column */}
                        <div className="md:col-span-4 space-y-2">
                          <div className="relative rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-black/50 aspect-video md:aspect-square flex items-center justify-center">
                            <img src={img} alt={`Panel #${idx + 1}`} className="w-full h-full object-contain" />
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => handleDownloadSinglePanelImage(idx)}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] flex items-center justify-center gap-1 transition-colors ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
                            >
                              <Download className="w-3.5 h-3.5 text-blue-500" /> Unduh Gambar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePanel(idx)}
                              className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center gap-1 transition-colors text-[11px]"
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
                            className={`w-full p-3 rounded-xl border text-xs md:text-sm focus:outline-none focus:border-blue-500 leading-relaxed resize-y ${inputClass}`}
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
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-800/80 flex items-center gap-2 flex-wrap">
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
                                className={`w-full p-2 rounded-lg border text-xs focus:outline-none focus:border-blue-500 ${selectClass}`}
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
                              <audio key={panelAudioUrls[idx]!} controls src={panelAudioUrls[idx]!} className="w-full h-8 rounded-lg border border-gray-300 dark:border-gray-700" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Langkah 4: Ekspor Hasil */}
                <div className={`p-6 rounded-2xl border ${cardClass} space-y-4 mt-8`}>
                  <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
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
                      className={`py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 border transition-colors cursor-pointer ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'}`}
                    >
                      <Download className="w-4 h-4 text-emerald-500" /> 📥 Unduh File Naskah (.txt)
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
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                      <h4 className="font-bold text-sm flex items-center gap-2 text-blue-500">
                        <Sparkles className="w-4 h-4" /> Hasil Penggabungan Naskah Alur Cerita
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(manualScriptResult, setManualCopied)}
                          className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
                        >
                          {manualCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {manualCopied ? 'Tersalin' : 'Salin'}
                        </button>
                        <button
                          onClick={() => downloadTxt(manualScriptResult, 'naskah_alur_cerita_komik.txt')}
                          className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
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

                    <div className={`text-xs md:text-sm ${textSubtle} leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2`}>
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
                Multi-Panel <span className="text-blue-500">Manga Script</span>
              </h2>
              <p className={`text-xs md:text-sm ${textMuted}`}>
                Unggah panel-panel manga Anda dan biarkan AI merangkai naskah narasi yang mengalir santai.
              </p>
            </div>

            {/* Upload Area */}
            <div className={`p-8 rounded-2xl border ${cardClass} text-center space-y-4`}>
              <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Pilih Gambar Panel Manga</h3>
                <p className={`text-xs ${textMuted} mt-1`}>
                  Pilih beberapa gambar panel sekaligus (Maksimal 200). Urutan baca akan disesuaikan (Kanan ke Kiri).
                </p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
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
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
                      GAYA: SANTAI & RTL
                    </span>
                  </div>
                  <button 
                    onClick={() => setMangaImages([])}
                    className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {mangaImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 aspect-square bg-gray-100 dark:bg-black/40">
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
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium cursor-pointer ${mangaHook ? 'bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300 font-bold' : (themeMode === 'dark' ? 'bg-gray-800/40 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-700')}`}>
                      <input 
                        type="checkbox" 
                        checked={mangaHook} 
                        onChange={(e) => setMangaHook(e.target.checked)} 
                        className="rounded accent-blue-500" 
                      />
                      Pakai Hook Pembuka
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium cursor-pointer ${mangaOutro ? 'bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300 font-bold' : (themeMode === 'dark' ? 'bg-gray-800/40 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-700')}`}>
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
                    <div className={`flex justify-between text-xs ${textMuted}`}>
                      <span>Panjang Target (Kata)</span>
                      <span className="font-bold text-blue-500">{mangaWordCount} Kata</span>
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
                    <span className={`text-xs ${textMuted}`}>Gaya Narasi</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMangaStyle('baku')}
                        className={`py-2 text-xs font-medium rounded-lg border transition-colors ${mangaStyle === 'baku' ? 'bg-blue-600 border-blue-500 text-white' : (themeMode === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200')}`}
                      >
                        Baku (Formal)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMangaStyle('santai')}
                        className={`py-2 text-xs font-medium rounded-lg border transition-colors ${mangaStyle === 'santai' ? 'bg-blue-600 border-blue-500 text-white' : (themeMode === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200')}`}
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
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs">
                {mangaError}
              </div>
            )}

            {/* Result Box */}
            {mangaScriptResult && (
              <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                  <h4 className="font-bold text-sm flex items-center gap-2 text-blue-500">
                    <Sparkles className="w-4 h-4" /> Hasil Naskah Manga
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(mangaScriptResult, setMangaCopied)}
                      className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
                    >
                      {mangaCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {mangaCopied ? 'Tersalin' : 'Salin'}
                    </button>
                    <button
                      onClick={() => downloadTxt(mangaScriptResult, 'naskah_manga_script.txt')}
                      className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'}`}
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

                <div className={`text-xs md:text-sm ${textSubtle} leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2`}>
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
                Fitur <span className="text-blue-500">Text to Speech</span>
              </h2>
              <p className={`text-xs md:text-sm ${textMuted}`}>
                Ubah teks Anda menjadi suara narasi berkualitas tinggi secara instan.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${cardClass} space-y-5`}>
              {/* Text Input */}
              <div className="space-y-2">
                <div className={`flex justify-between items-center text-xs ${textMuted}`}>
                  <label className="font-semibold">Teks Narasi</label>
                  <span>{ttsText.length}/50000</span>
                </div>
                <textarea
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="Masukkan teks yang ingin diubah menjadi suara di sini..."
                  className={`w-full h-44 p-4 rounded-xl border focus:border-blue-500 focus:outline-none text-xs md:text-sm leading-relaxed resize-none ${inputClass}`}
                />
              </div>

              {/* Voice Character Selection */}
              <div className="space-y-2">
                <label className={`text-xs font-semibold ${textSubtle}`}>Pilih Karakter Suara</label>
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-xs md:text-sm focus:border-blue-500 focus:outline-none ${selectClass}`}
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
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
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
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs">
                  {ttsError}
                </div>
              )}
            </div>

            {/* Tips Penggunaan */}
            <div className={`p-6 rounded-2xl border ${cardClass} space-y-3`}>
              <div className="flex items-center gap-2 text-blue-500 text-xs font-bold">
                <Info className="w-4 h-4" /> Tips Penggunaan TTS
              </div>
              <ul className={`text-xs ${textMuted} space-y-2 list-disc list-inside leading-relaxed`}>
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
                Generator Skrip <span className="text-purple-500">Video Short / Reels</span>
              </h2>
              <p className={`text-xs md:text-sm ${textMuted}`}>
                Fitur baru untuk membantu Anda membuat skrip video pendek dari ide cerita sederhana.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
              {/* Input Idea */}
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${textSubtle}`}>Ide / Topik Cerita Utama</label>
                <textarea
                  value={videoIdea}
                  onChange={(e) => setVideoIdea(e.target.value)}
                  placeholder="Contoh: Karakter utama dikhianati oleh klannya namun mendapatkan kekuatan dewa naga kegelapan..."
                  className={`w-full h-28 p-3 rounded-xl border focus:border-purple-500 focus:outline-none text-xs md:text-sm leading-relaxed resize-none ${inputClass}`}
                />
              </div>

              {/* Grid Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={`text-xs ${textMuted}`}>Durasi Target</label>
                  <select
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border text-xs focus:border-purple-500 focus:outline-none ${selectClass}`}
                  >
                    <option value="15 Detik">15 Detik</option>
                    <option value="30 Detik">30 Detik</option>
                    <option value="60 Detik">60 Detik</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs ${textMuted}`}>Platform</label>
                  <select
                    value={videoPlatform}
                    onChange={(e) => setVideoPlatform(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border text-xs focus:border-purple-500 focus:outline-none ${selectClass}`}
                  >
                    <option value="TikTok / Reels">TikTok / Reels</option>
                    <option value="YouTube Shorts">YouTube Shorts</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={`text-xs ${textMuted}`}>Nada Bicara</label>
                  <select
                    value={videoTone}
                    onChange={(e) => setVideoTone(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border text-xs focus:border-purple-500 focus:outline-none ${selectClass}`}
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
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs">
                  {videoError}
                </div>
              )}

              {/* Result Display */}
              {videoScriptResult && (
                <div className={`p-5 rounded-xl border space-y-3 ${cardClass}`}>
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                    <h4 className="font-bold text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
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

                  <div className={`text-xs md:text-sm ${textSubtle} leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto pr-1`}>
                    {videoScriptResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- TAB 6: LISENSI & AKUN PENGGUNA ---------------- */}
        {activeTab === 'login' && (
          <div className="space-y-6 max-w-xl mx-auto animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500 shadow-xl shadow-emerald-500/10">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Status Lisensi & Akun Pengguna
              </h2>
              <p className={`text-xs md:text-sm ${textMuted}`}>
                Lisensi aktif Anda bertindak sebagai identitas akun resmi untuk menggunakan seluruh fitur aplikasi.
              </p>
            </div>

            {activeLicense ? (
              /* LICENSED STATUS CARD */
              <div className={`p-6 rounded-2xl border ${cardClass} space-y-6 shadow-xl`}>
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold">
                      <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-base ${themeHeading} flex items-center gap-2`}>
                        {activeLicense.buyerName}
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30 uppercase">
                          {activeLicense.type}
                        </span>
                      </h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">Kode User: {activeLicense.key}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border text-xs font-mono ${themeMode === 'dark' ? 'bg-gray-900/80 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                  <p><span className={textMuted}>Tanggal Aktivasi:</span> {activeLicense.activatedAt}</p>
                  <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>Sisa Masa Berlaku: {getRemainingTimeString(activeLicense.expiresAt)}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${themeMode === 'dark' ? 'bg-gray-900/50 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Akses Unlocked Full VIP</span>
                  </div>
                  <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${themeMode === 'dark' ? 'bg-gray-900/50 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                    <Key className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      {userGeminiKey 
                        ? `API Key (${userAiProvider === 'groq' ? 'Groq' : userAiProvider === 'kie' ? 'Kie AI' : 'Gemini'})` 
                        : 'API Key Belum Terpasang'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => setActiveTab('home')}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <HomeIcon className="w-4 h-4" />
                    <span>Mulai Buat Alur Cerita Komik</span>
                  </button>

                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border transition-colors ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'}`}
                  >
                    <Settings className="w-4 h-4 text-blue-500" />
                    <span>Buka Pengaturan API Key</span>
                  </button>

                  <button
                    onClick={handleDeactivateLicense}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 border border-rose-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Cabut Lisensi dari Perangkat Ini</span>
                  </button>
                </div>
              </div>
            ) : (
              /* NOT LICENSED CARD */
              <div className={`p-6 rounded-2xl border ${cardClass} space-y-5 shadow-xl text-center`}>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="font-bold text-lg text-amber-700 dark:text-amber-300">Perangkat Belum Teraktivasi Lisensi</h3>
                <p className={`text-xs ${textMuted} leading-relaxed max-w-md mx-auto`}>
                  Silakan dapatkan kode lisensi resmi via WhatsApp Admin atau masukkan kode lisensi yang Anda miliki untuk membuka seluruh akses.
                </p>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setShowLicenseGateModal(true)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Aktivasi Kode Lisensi Sekarang</span>
                  </button>

                  <a
                    href={ADMIN_WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border transition-colors ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-emerald-400 border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-emerald-700 border-gray-300'}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Minta / Beli Lisensi via WhatsApp Admin</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ---------------- FIXED BOTTOM NAVIGATION BAR ---------------- */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t ${themeMode === 'dark' ? 'bg-[#0B0F17]/95 border-gray-800 backdrop-blur-md' : 'bg-white/95 border-gray-200 backdrop-blur-md'}`}>
        <div className="max-w-lg mx-auto grid grid-cols-6 h-16 px-1">
          
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
              activeTab === 'home' ? 'text-blue-500 font-bold' : (themeMode === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span>Beranda</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
              activeTab === 'manual' ? 'text-blue-500 font-bold' : (themeMode === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')
            }`}
          >
            <Scissors className="w-5 h-5" />
            <span>Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('naskah')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
              activeTab === 'naskah' ? 'text-blue-500 font-bold' : (themeMode === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Naskah</span>
          </button>

          <button
            onClick={() => setActiveTab('video-script')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
              activeTab === 'video-script' ? 'text-blue-500 font-bold' : (themeMode === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')
            }`}
          >
            <Video className="w-5 h-5" />
            <span>Skrip</span>
          </button>

          <button
            onClick={() => setActiveTab('tts')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
              activeTab === 'tts' ? 'text-blue-500 font-bold' : (themeMode === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')
            }`}
          >
            <Volume2 className="w-5 h-5" />
            <span>TTS</span>
          </button>

          <button
            onClick={() => setShowLicenseGateModal(true)}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-medium transition-colors ${themeMode === 'dark' ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-600'}`}
          >
            <ShieldCheck className={`w-5 h-5 ${activeLicense ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>Lisensi</span>
          </button>

        </div>
      </nav>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="mt-12 text-center text-xs text-gray-500 space-y-2 py-6 border-t border-gray-800/50 mb-16">
        <p className="font-medium text-gray-400">Terima kasih telah berkunjung</p>
        <p className="text-[10px] text-gray-600">
          © 2026 Asisten Alur cerita komik • Made with ❤️ and Gemini AI
        </p>
        <div>
          <button
            onClick={() => setShowAdminGeneratorModal(true)}
            className="text-[10px] text-gray-400 hover:text-purple-500 transition-colors font-mono cursor-pointer"
            title="Panel Admin"
          >
            aniki
          </button>
        </div>
      </footer>

      {/* ---------------- SETTINGS MODAL ---------------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${cardClass} space-y-5 relative max-h-[90vh] overflow-y-auto`}>
            
            <button
              onClick={() => setShowSettingsModal(false)}
              className={`absolute top-4 right-4 p-1 rounded-lg ${themeMode === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-base ${themeHeading}`}>Pengaturan & Lisensi</h3>
                <p className={`text-xs ${textMuted}`}>Kelola Kunci API Gemini dan Status Akses Lisensi</p>
              </div>
            </div>

            {/* License Overview in Settings */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${themeMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Status Lisensi Akses
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                  {activeLicense ? activeLicense.type : 'Belum Berlisensi'}
                </span>
              </div>

              {activeLicense ? (
                <div className={`text-xs space-y-1 ${textSubtle}`}>
                  <p><span className={textMuted}>Kode User:</span> <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{activeLicense.key}</strong></p>
                  <p className="flex items-center gap-1 text-emerald-600 dark:text-emerald-300 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Sisa Waktu: <strong>{getRemainingTimeString(activeLicense.expiresAt)}</strong></span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Masukkan kode lisensi untuk membuka akses aplikasi.</p>
              )}

              <button
                onClick={() => { setShowSettingsModal(false); setShowLicenseGateModal(true); }}
                className="w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors mt-1"
              >
                {activeLicense ? 'Lihat Detail / Ganti Lisensi' : 'Aktivasi Lisensi Sekarang'}
              </button>
            </div>

            {/* Provider Selection */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${textSubtle}`}>
                <Sliders className="w-3.5 h-3.5 text-blue-500" /> Pilih Penyedia AI (Provider):
              </label>
              <select
                value={providerTemp}
                onChange={(e) => setProviderTemp(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:border-blue-500 focus:outline-none ${inputClass}`}
              >
                <option value="gemini">♊ Google Gemini AI (Rekomendasi Utama & Gratis)</option>
                <option value="groq">⚡ Groq AI (Super Cepat - Llama 3.3 / Llama 3.2 Vision)</option>
                <option value="kie">🤖 Kie AI (kie.ai - Multi AI Model API / OpenAI Compatible)</option>
              </select>
            </div>

            {/* Instruction Guide Box per Provider */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-2 text-blue-900 dark:text-blue-200">
              <div className="font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                <Key className="w-4 h-4" /> 
                {providerTemp === 'groq' ? 'Cara Mendapatkan Kunci API Groq (Gratis):' :
                 providerTemp === 'kie' ? 'Cara Mendapatkan Kunci API Kie AI (kie.ai):' :
                 'Cara Mendapatkan Kunci API Gemini Gratis:'}
              </div>
              <ol className={`list-decimal list-inside space-y-1 text-[11px] ${textMuted}`}>
                {providerTemp === 'groq' ? (
                  <>
                    <li>Buka Groq Console melalui tombol di bawah.</li>
                    <li>Login dengan akun Anda & buat API Key baru (awalan <code>gsk_...</code>).</li>
                    <li>Salin Kunci API tersebut dan tempelkan di kolom di bawah ini.</li>
                  </>
                ) : providerTemp === 'kie' ? (
                  <>
                    <li>Buka platform Kie AI (kie.ai) melalui tombol di bawah.</li>
                    <li>Login ke dashboard & buat API Key baru.</li>
                    <li>Salin Kunci API dan tempelkan pada kolom di bawah ini.</li>
                  </>
                ) : (
                  <>
                    <li>Buka Google AI Studio melalui tombol di bawah.</li>
                    <li>Login dengan akun Google Anda & klik <strong>"Create API key"</strong>.</li>
                    <li>Salin Kunci API (awalan <code>AIzaSy...</code>) dan tempel di bawah.</li>
                  </>
                )}
              </ol>
              <a
                href={
                  providerTemp === 'groq' ? 'https://console.groq.com/keys' :
                  providerTemp === 'kie' ? 'https://kie.ai' :
                  'https://aistudio.google.com/app/apikey'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors mt-1"
              >
                Dapatkan API Key {providerTemp === 'groq' ? 'Groq' : providerTemp === 'kie' ? 'Kie AI' : 'Gemini'} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className={`text-xs font-semibold ${textSubtle}`}>
                  Tempel Kunci API ({providerTemp === 'groq' ? 'Groq gsk_...' : providerTemp === 'kie' ? 'Kie AI' : 'Gemini AIzaSy...'}) Anda:
                </label>
                <input
                  type="password"
                  value={keyInputTemp}
                  onChange={(e) => setKeyInputTemp(e.target.value)}
                  placeholder={
                    providerTemp === 'groq' ? 'gsk_...' :
                    providerTemp === 'kie' ? 'Masukkan API Key Kie AI Anda' :
                    'AIzaSy...'
                  }
                  className={`w-full p-3 rounded-xl border text-xs focus:border-blue-500 focus:outline-none ${inputClass}`}
                />
              </div>

              {providerTemp === 'kie' && (
                <div className="space-y-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <div className="space-y-1">
                    <label className={`text-[11px] font-semibold ${textSubtle}`}>
                      Custom API Endpoint URL (Opsional):
                    </label>
                    <input
                      type="text"
                      value={customEndpointTemp}
                      onChange={(e) => setCustomEndpointTemp(e.target.value)}
                      placeholder="https://api.kie.ai/v1/chat/completions"
                      className={`w-full p-2.5 rounded-lg border text-xs focus:border-blue-500 focus:outline-none ${inputClass}`}
                    />
                    <p className="text-[10px] text-gray-400">Jika endpoint Kie AI Anda berbeda, sesuaikan di sini. Default: <code>https://api.kie.ai/v1/chat/completions</code></p>
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[11px] font-semibold ${textSubtle}`}>
                      Nama Model / Target Model (Opsional):
                    </label>
                    <input
                      type="text"
                      value={customModelTemp}
                      onChange={(e) => setCustomModelTemp(e.target.value)}
                      placeholder="gpt-4o-mini"
                      className={`w-full p-2.5 rounded-lg border text-xs focus:border-blue-500 focus:outline-none ${inputClass}`}
                    />
                    <p className="text-[10px] text-gray-400">Default: <code>gpt-4o-mini</code></p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSaveGeminiKey}
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> Simpan Kunci
                </button>
                <button
                  onClick={handleDeleteGeminiKey}
                  className={`py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1 border ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-rose-600/80 text-gray-300 hover:text-white border-gray-700' : 'bg-gray-100 hover:bg-rose-600 hover:text-white text-gray-700 border-gray-300'}`}
                >
                  <Trash2 className="w-4 h-4" /> Hapus Kunci
                </button>
              </div>

              <button
                onClick={handleTestGeminiKey}
                disabled={keyTestLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600/20 dark:bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600/40 text-indigo-700 dark:text-indigo-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {keyTestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Uji Koneksi Kunci API
              </button>

              {keyTestResult && (
                <div className={`p-3 rounded-xl border text-xs ${keyTestResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}`}>
                  {keyTestResult.message}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ------------------ PWA INSTALLATION MODAL ------------------ */}
      {showPwaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl space-y-5 relative ${cardClass}`}>
            <button
              onClick={() => setShowPwaModal(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg ${themeMode === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Logo App" 
                className="w-12 h-12 rounded-xl object-cover border border-blue-500/40 shadow-lg shadow-blue-500/20"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.jpg'; }}
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className={`font-bold text-base flex items-center gap-1.5 ${themeHeading}`}>
                  <Smartphone className="w-4 h-4 text-blue-500" /> Install Aplikasi PWA
                </h3>
                <p className={`text-xs ${textMuted}`}>Asisten Alur Cerita Komik AI</p>
              </div>
            </div>

            <div className={`space-y-3 text-xs ${textSubtle} leading-relaxed`}>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                <p className="font-semibold text-blue-600 dark:text-blue-300">💡 Cara Menginstall di Smartphone & Laptop:</p>
                <ul className={`list-disc list-inside space-y-1 text-[11px] ${textMuted}`}>
                  <li><strong>Android / Chrome:</strong> Klik tombol opsi browser (titik tiga ⋮) di sudut kanan atas → Pilih <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                  <li><strong>iOS / Safari (iPhone/iPad):</strong> Klik tombol <strong>Share (Bagikan)</strong> di bagian bawah layar Safari → Pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
                  <li><strong>Desktop / PC:</strong> Klik ikon install ⊕ di bilah alamat browser (URL bar) atau buka menu browser → <strong>Instal Asisten Komik AI</strong>.</li>
                </ul>
              </div>

              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
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

      {/* ------------------ LICENSE GATE MODAL ------------------ */}
      {showLicenseGateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className={`max-w-lg w-full p-6 rounded-2xl border shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto ${cardClass}`}>
            
            {/* Render close button ONLY if user already has an active license */}
            {activeLicense && (
              <button
                onClick={() => setShowLicenseGateModal(false)}
                className={`absolute top-4 right-4 p-1.5 rounded-lg ${themeMode === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500 shadow-xl shadow-amber-500/10">
                <ShieldCheck className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className={`font-extrabold text-xl ${themeHeading}`}>
                {activeLicense ? 'Detail Lisensi Perangkat Anda' : 'Aktivasi Lisensi Akses Komik AI'}
              </h3>
              <p className={`text-xs ${textMuted} leading-relaxed`}>
                {activeLicense 
                  ? 'Perangkat Anda telah memiliki lisensi aktif dan dapat menggunakan seluruh fitur aplikasi.'
                  : 'Lisensi diperlukan untuk membuka dan menggunakan seluruh fitur pembuat alur cerita komik AI.'}
              </p>
            </div>

            {/* License Alert Messages */}
            {licenseSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{licenseSuccess}</span>
              </div>
            )}

            {licenseError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{licenseError}</span>
              </div>
            )}

            {activeLicense ? (
              /* ALREADY LICENSED VIEW */
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Status Lisensi: Aktif
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold uppercase">
                    {activeLicense.type}
                  </span>
                </div>
                
                <div className={`space-y-1.5 text-xs font-mono p-3 rounded-lg border ${themeMode === 'dark' ? 'bg-gray-900/80 text-gray-300 border-gray-800' : 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                  <p><span className={textMuted}>Kode Lisensi / User:</span> <strong className="text-emerald-600 dark:text-emerald-300">{activeLicense.key}</strong></p>
                  <p><span className={textMuted}>Pemilik Lisensi:</span> {activeLicense.buyerName}</p>
                  <p><span className={textMuted}>Tanggal Aktivasi:</span> {activeLicense.activatedAt}</p>
                  <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold pt-1 border-t border-gray-200 dark:border-gray-800">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>Sisa Waktu: {getRemainingTimeString(activeLicense.expiresAt)}</span>
                  </p>
                </div>

                <button
                  onClick={handleDeactivateLicense}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Cabut Lisensi / Ganti Lisensi Baru</span>
                </button>
              </div>
            ) : (
              /* NEED LICENSE VIEW */
              <div className="space-y-4">
                {/* Step 1: Request Key via WhatsApp */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-emerald-900/10 to-teal-950/20 dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-teal-950/40 border border-emerald-500/40 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Belum Memiliki Kode Lisensi?</h4>
                      <p className={`text-[11px] ${textMuted} mt-0.5`}>
                        Hubungi Admin langsung melalui WhatsApp untuk mendapatkan atau membeli Kode Lisensi resmi.
                      </p>
                    </div>
                  </div>

                  <a
                    href={ADMIN_WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Minta / Beli Kode Lisensi via WhatsApp</span>
                  </a>
                </div>

                {/* Step 2: Input & Activate License Key */}
                <div className={`p-4 rounded-2xl border space-y-3 ${themeMode === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${textSubtle}`}>Sudah Punya Kode Lisensi?</h4>
                      <p className={`text-[11px] ${textMuted} mt-0.5`}>
                        Masukkan kode lisensi yang Anda terima dari Admin WhatsApp.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={inputLicenseKey}
                      onChange={(e) => setInputLicenseKey(e.target.value)}
                      placeholder="Masukkan Kode Lisensi Anda di sini..."
                      className={`w-full p-3 rounded-xl border text-xs font-mono tracking-widest uppercase focus:border-emerald-500 focus:outline-none ${inputClass}`}
                    />
                    <button
                      onClick={() => validateAndActivateKey(inputLicenseKey)}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aktivasi Kode Lisensi Sekarang</span>
                    </button>
                  </div>
                </div>

                {/* Admin Generator Button */}
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setShowAdminGeneratorModal(true)}
                    className="text-[10px] text-gray-400 hover:text-purple-500 font-mono transition-colors cursor-pointer"
                  >
                    aniki
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------ ADMIN LICENSE GENERATOR MODAL ------------------ */}
      {showAdminGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto ${cardClass}`}>
            
            <button
              onClick={() => { setShowAdminGeneratorModal(false); setIsAdminUnlocked(false); }}
              className={`absolute top-4 right-4 p-1.5 rounded-lg ${themeMode === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-500">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className={`font-bold text-base ${themeHeading}`}>Panel Generator Kode Lisensi Admin</h3>
              <p className={`text-xs ${textMuted}`}>Khusus Pemilik / Admin Aplikasi</p>
            </div>

            {!isAdminUnlocked ? (
              /* ADMIN PIN FORM */
              <form onSubmit={handleAdminPinSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className={`text-xs font-semibold ${textSubtle}`}>Masukkan PIN Admin:</label>
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="Masukkan PIN Admin"
                    className={`w-full p-3 rounded-xl border text-xs focus:border-purple-500 focus:outline-none ${inputClass}`}
                  />
                  {adminPinError && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{adminPinError}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-600/30"
                >
                  Buka Panel Admin
                </button>
              </form>
            ) : (
              /* UNLOCKED ADMIN GENERATOR PANEL */
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Akses Admin Terverifikasi (PIN 2587)</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className={`text-xs font-medium ${textSubtle}`}>Nama Pembeli / Pemesan:</label>
                    <input
                      type="text"
                      value={genBuyerName}
                      onChange={(e) => setGenBuyerName(e.target.value)}
                      placeholder="Contoh: Fitra - Makassar"
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-purple-500 ${inputClass}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`text-xs font-medium ${textSubtle}`}>Jenis Lisensi & Awalan Kode:</label>
                    <select
                      value={genLicenseType}
                      onChange={(e) => setGenLicenseType(e.target.value as any)}
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-purple-500 ${selectClass}`}
                    >
                      <option value="VIP Lifetime">VIP Lifetime (Awalan: komik-vip-)</option>
                      <option value="Akses 30 Hari">Akses 30 Hari (Awalan: komik-mon-)</option>
                      <option value="Akses 1 Tahun">Akses 1 Tahun (Awalan: komik-pro-)</option>
                      <option value="Akses 1 Jam">Akses 1 Jam (Awalan: komik-preview-)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateNewKey}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Buat Kode Lisensi Baru</span>
                  </button>
                </div>

                {generatedKeyResult && (
                  <div className={`p-4 rounded-xl border space-y-2 ${themeMode === 'dark' ? 'bg-gray-950 border-purple-500/40' : 'bg-purple-50/50 border-purple-300'}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Kode Lisensi Hasil Generator:</p>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-purple-500/30 font-mono text-sm font-bold text-purple-600 dark:text-purple-300 text-center tracking-widest">
                      {generatedKeyResult}
                    </div>
                    <button
                      onClick={() => {
                        const message = `Halo ${genBuyerName || 'Kreator'}, Terima kasih telah memesan Lisensi Komik AI!\n\nBerikut Kode Lisensi Anda:\n*${generatedKeyResult}*\nJenis: ${genLicenseType}\n\nBuka aplikasi dan tempel kode lisensi di atas pada menu Aktivasi Lisensi. Selamat berkarya!`;
                        navigator.clipboard.writeText(message);
                        setCopyToast('Pesan balasan WA berisi Kode Lisensi telah disalin!');
                        setTimeout(() => setCopyToast(null), 3500);
                      }}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Pesan Balasan WA</span>
                    </button>
                    {copyToast && (
                      <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold text-center flex items-center justify-center gap-1.5 animate-fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{copyToast}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Registered Licenses List with Delete Confirmation, Export & Expired Filters */}
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <p className={`text-[11px] font-bold ${textSubtle}`}>
                      Daftar Lisensi ({registeredLicenses.length}):
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleExportLicensesCSV}
                        className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-[10px] text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1 transition-all active:scale-95"
                        title="Ekspor daftar lisensi ke format .CSV"
                      >
                        <FileDown className="w-3 h-3" />
                        <span>Ekspor .CSV</span>
                      </button>
                      <button
                        onClick={handleExportLicensesJSON}
                        className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-[10px] text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1 transition-all active:scale-95"
                        title="Ekspor daftar lisensi ke format .JSON"
                      >
                        <Download className="w-3 h-3" />
                        <span>Ekspor .JSON</span>
                      </button>
                      <button
                        onClick={handleDeleteExpiredLicenses}
                        className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 transition-all active:scale-95"
                        title="Hapus semua lisensi yang sudah kadaluarsa"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Kadaluarsa</span>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 text-[10px] font-mono">
                    {registeredLicenses.length === 0 ? (
                      <p className={`text-center py-2 ${textMuted}`}>Belum ada lisensi terdaftar.</p>
                    ) : (
                      registeredLicenses.map((item, idx) => {
                        const isExpired = item.expiresAt && Date.now() > item.expiresAt;
                        return (
                          <div key={idx} className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${isExpired ? 'bg-rose-500/10 border-rose-500/30' : (themeMode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200')}`}>
                            <div className="space-y-0.5 truncate">
                              <div className="flex items-center gap-1.5">
                                <strong className={themeHeading}>{item.key}</strong>
                                <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${isExpired ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}>
                                  {isExpired ? 'KADALUARSA' : item.type}
                                </span>
                              </div>
                              <p className={`text-[9px] ${textMuted}`}>Pemilik: {item.buyerName}</p>
                              <p className={`text-[9px] ${textMuted}`}>
                                Sisa: {getRemainingTimeString(item.expiresAt)}
                              </p>
                            </div>

                            <button
                              onClick={() => handleDeleteRegisteredLicense(item.key)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 transition-all shrink-0 active:scale-95 cursor-pointer"
                              title={`Hapus lisensi ${item.key}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- SINGLE LICENSE DELETE CONFIRMATION MODAL ---------------- */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`max-w-sm w-full p-5 rounded-2xl border border-rose-500/40 shadow-2xl space-y-4 text-center ${cardClass}`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 shadow-lg shadow-rose-500/10">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className={`font-extrabold text-base ${themeHeading}`}>Konfirmasi Hapus Lisensi</h4>
              <p className={`text-xs ${textMuted}`}>
                Apakah Anda yakin ingin menghapus lisensi ini dari sistem?
              </p>
              <div className={`p-2.5 rounded-xl border text-left font-mono text-xs space-y-1 mt-2 ${themeMode === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <p><span className={textMuted}>Kode:</span> <strong className="text-rose-600 dark:text-rose-400">{deleteConfirmTarget.key}</strong></p>
                <p><span className={textMuted}>Pemilik:</span> {deleteConfirmTarget.buyerName}</p>
                <p><span className={textMuted}>Jenis:</span> {deleteConfirmTarget.type}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-colors border ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'}`}
              >
                Batal
              </button>
              <button
                onClick={executeDeleteSingleLicense}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- EXPIRED LICENSES BULK DELETE CONFIRMATION MODAL ---------------- */}
      {deleteConfirmExpiredModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`max-w-sm w-full p-5 rounded-2xl border border-rose-500/40 shadow-2xl space-y-4 text-center ${cardClass}`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 shadow-lg shadow-rose-500/10">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className={`font-extrabold text-base ${themeHeading}`}>Hapus Semua Lisensi Kadaluarsa?</h4>
              <p className={`text-xs ${textMuted}`}>
                Semua lisensi terdaftar yang masa berlakunya telah habis akan dihapus permanen dari sistem local storage perangkat.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirmExpiredModal(false)}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-colors border ${themeMode === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'}`}
              >
                Batal
              </button>
              <button
                onClick={executeDeleteExpiredLicenses}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
