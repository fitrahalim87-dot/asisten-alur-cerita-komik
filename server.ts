import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Communicate } from "edge-tts-universal";
import * as googleTTS from "google-tts-api";
import { GoogleGenAI, Type } from "@google/genai";

const currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

function parseDataUri(dataUri: string) {
  if (!dataUri) {
    return { mimeType: "image/png", data: "" };
  }
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return {
      mimeType: match[1],
      data: match[2],
    };
  }
  return {
    mimeType: "image/png",
    data: dataUri.includes(",") ? dataUri.split(",")[1] : dataUri,
  };
}

function formatGeminiError(err: any): string {
  const msg = err?.message || String(err || "");
  if (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("Quota exceeded") ||
    msg.includes("quota") ||
    msg.includes("rate limit")
  ) {
    return "Kuota API telah melampaui batas (Quota Exceeded / Rate Limit). Silakan atur atau ganti Kunci API Anda di menu Pengaturan (ikon roda gigi) atau tunggu beberapa saat sebelum mencoba lagi.";
  }
  return msg;
}

function getApiKeyAndProvider(req: express.Request) {
  const apiKey = (
    req.body.key ||
    req.body.apiKey ||
    req.headers["x-gemini-api-key"] as string ||
    req.headers["x-api-key"] as string ||
    ""
  ).trim();

  const provider = (
    req.body.provider ||
    req.headers["x-ai-provider"] as string ||
    "gemini"
  ).toLowerCase();

  let customEndpoint = (
    req.body.customEndpoint ||
    req.headers["x-custom-endpoint"] as string ||
    ""
  ).trim();

  let customModel = (
    req.body.customModel ||
    req.headers["x-custom-model"] as string ||
    ""
  ).trim();

  if (provider === "kie") {
    if (!customEndpoint) {
      customEndpoint = "https://api.kie.ai/v1/chat/completions";
    }
    if (!customModel) {
      customModel = "gpt-4o-mini";
    }
  } else if (provider === "openai") {
    if (!customEndpoint) {
      customEndpoint = "https://api.openai.com/v1/chat/completions";
    }
    if (!customModel) {
      customModel = "gpt-4o-mini";
    }
  }

  if (customEndpoint && !customEndpoint.startsWith("http://") && !customEndpoint.startsWith("https://")) {
    customEndpoint = "https://" + customEndpoint;
  }

  return { apiKey, provider, customEndpoint, customModel };
}

async function callOpenAICompatibleAPI({
  apiKey,
  endpoint,
  model,
  messages,
  responseFormatJson = false
}: {
  apiKey: string;
  endpoint: string;
  model: string;
  messages: any[];
  responseFormatJson?: boolean;
}) {
  const payload: any = {
    model,
    messages,
    temperature: 0.7,
  };
  if (responseFormatJson) {
    payload.response_format = { type: "json_object" };
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (networkErr: any) {
    throw new Error(`Gagal terhubung ke server API (${endpoint}): ${networkErr?.message || networkErr}`);
  }

  const rawText = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(rawText);
  } catch (e) {
    if (!res.ok) {
      throw new Error(`API Error (${res.status}): ${rawText.slice(0, 200)}`);
    }
  }

  if (!res.ok) {
    let errMsg = "";
    if (json) {
      if (typeof json.error === "string") {
        errMsg = json.error;
      } else if (typeof json.error?.message === "string") {
        errMsg = json.error.message;
      } else if (typeof json.message === "string") {
        errMsg = json.message;
      } else {
        errMsg = JSON.stringify(json);
      }
    } else {
      errMsg = rawText.trim() || `HTTP ${res.status}`;
    }

    const providerName = endpoint.includes("groq") ? "Groq AI" : endpoint.includes("kie") ? "Kie AI" : endpoint.includes("openai") ? "OpenAI" : "Custom AI";

    if (res.status === 405) {
      throw new Error(`HTTP 405 (Method Not Allowed) dari ${providerName}: Endpoint URL '${endpoint}' tidak mendukung request POST. Silakan periksa atau sesuaikan 'Custom API Endpoint URL' di Pengaturan (misal: https://api.kie.ai/v1/chat/completions atau endpoint OpenAI-compatible provider Anda).`);
    }

    if (res.status === 404) {
      throw new Error(`HTTP 404 (Not Found) dari ${providerName}: Endpoint URL '${endpoint}' tidak ditemukan. Mohon periksa kembali URL Endpoint di Pengaturan.`);
    }

    if (res.status === 401 || errMsg.toLowerCase().includes("invalid api key") || errMsg.toLowerCase().includes("unauthorized") || errMsg.toLowerCase().includes("authentication")) {
      throw new Error(`API Key ${providerName} tidak valid atau salah format. Mohon periksa kembali API Key Anda di Pengaturan. (Detail: ${errMsg})`);
    }

    throw new Error(`API Provider ${providerName} Error (${res.status}): ${errMsg}`);
  }

  if (!json || !json.choices || !json.choices[0]) {
    throw new Error(`Respon dari provider tidak valid: ${rawText.slice(0, 200)}`);
  }

  return json.choices?.[0]?.message?.content || "";
}

export const app = express();

app.use(express.json({ limit: "50mb" }));

  // POST endpoint for high-quality, natural Text-To-Speech
  app.post("/api/tts", async (req, res) => {
    const { text, voice } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: "Text harus dikirimkan." });
      return;
    }

    const ttsVoice = voice || "id-ID-ArdiNeural";
    let audioBuffer: Buffer | null = null;

    // 1. Primary: Edge TTS via edge-tts-universal (supports authentic male Ardi, female Gadis, etc.)
    try {
      const comm = new Communicate(text, { voice: ttsVoice });
      const chunks: Buffer[] = [];
      for await (const chunk of comm.stream()) {
        if (chunk.type === "audio" && chunk.data) {
          chunks.push(chunk.data);
        }
      }
      if (chunks.length > 0) {
        audioBuffer = Buffer.concat(chunks);
      }
    } catch (edgeErr: any) {
      console.warn("Edge TTS universal failed, falling back to Google Translate TTS:", edgeErr);
    }

    // 2. Secondary fallback: Google Translate TTS
    if (!audioBuffer || audioBuffer.length === 0) {
      try {
        const lang = ttsVoice.toLowerCase().startsWith("en") ? "en" : "id";
        const base64AudioList = await googleTTS.getAllAudioBase64(text, {
          lang,
          slow: false,
          host: "https://translate.google.com",
          timeout: 10000,
        });

        const chunks = base64AudioList.map((item) => Buffer.from(item.base64, "base64"));
        audioBuffer = Buffer.concat(chunks);
      } catch (gErr: any) {
        console.error("Google TTS Fallback juga gagal:", gErr);
      }
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      res.status(500).json({ error: "Gagal memproses suara TTS. Silakan coba lagi." });
      return;
    }

    const base64Audio = audioBuffer.toString("base64");
    const audioDataUri = `data:audio/mp3;base64,${base64Audio}`;

    res.json({
      success: true,
      audioUrl: audioDataUri,
      audioBase64: base64Audio,
    });
  });

  // POST endpoint to validate and test API keys across providers
  app.post("/api/test-key", async (req, res) => {
    const { apiKey, provider, customEndpoint, customModel } = getApiKeyAndProvider(req);

    if (!apiKey) {
      res.status(400).json({ error: "Silakan masukkan Kunci API terlebih dahulu untuk diuji!" });
      return;
    }

    try {
      if (provider === "groq") {
        const reply = await callOpenAICompatibleAPI({
          apiKey,
          endpoint: "https://api.groq.com/openai/v1/chat/completions",
          model: customModel || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "Katakan OK jika terhubung!" }]
        });
        res.json({ success: true, text: `[Groq AI Connected] ${reply}` });
      } else if (provider === "kie" || provider === "openai" || provider === "custom") {
        const endpoint = customEndpoint || "https://api.kie.ai/v1/chat/completions";
        const model = customModel || "gpt-4o-mini";
        const reply = await callOpenAICompatibleAPI({
          apiKey,
          endpoint,
          model,
          messages: [{ role: "user", content: "Katakan OK jika terhubung!" }]
        });
        res.json({ success: true, text: `[${provider === "kie" ? "Kie AI" : provider === "openai" ? "OpenAI" : "Custom AI"} Connected] ${reply}` });
      } else {
        // Default Gemini
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Katakan "OK" jika terhubung!'
        });

        if (response && response.text) {
          res.json({ success: true, text: `[Gemini AI Connected] ${response.text}` });
        } else {
          res.status(500).json({ error: "Kombinasi kunci valid namun tidak mengembalikan respon teks." });
        }
      }
    } catch (err: any) {
      console.error("Gagal melakukan pengecekan Kunci API:", err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // POST endpoint to generate storyline scripts using Multi-Provider AI
  app.post("/api/generate-script", async (req, res) => {
    const { image, previousContext } = req.body;
    const { apiKey, provider, customEndpoint, customModel } = getApiKeyAndProvider(req);

    if (!apiKey) {
      res.status(400).json({ error: "Kunci API pengguna diperlukan! Silakan masukkan API Key Anda (Gemini, Groq, Kie AI/OpenAI) di menu Pengaturan (ikon roda gigi di kanan atas)." });
      return;
    }

    if (!image) {
      res.status(400).json({ error: "Gambar panel komik belum disediakan." });
      return;
    }

    try {
      const prompt = `Analisis gambar panel komik ini. ${previousContext || ""} Lanjutkan cerita dengan mendeskripsikan adegan di gambar ini dalam 1-2 kalimat dengan gaya bahasa naratif yang dramatis dan puitis untuk alur cerita video. Fokus pada aksi, ekspresi, dan suasana.`;
      const { mimeType, data: base64Data } = parseDataUri(image);

      if (provider === "groq") {
        const text = await callOpenAICompatibleAPI({
          apiKey,
          endpoint: "https://api.groq.com/openai/v1/chat/completions",
          model: customModel || "llama-3.2-11b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
              ]
            }
          ]
        });
        res.json({ text });
      } else if (provider === "kie" || provider === "openai" || provider === "custom") {
        const endpoint = customEndpoint || "https://api.kie.ai/v1/chat/completions";
        const model = customModel || "gpt-4o-mini";
        const text = await callOpenAICompatibleAPI({
          apiKey,
          endpoint,
          model,
          messages: [{ role: "user", content: prompt }]
        });
        res.json({ text });
      } else {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            { parts: [{ text: prompt }, { inlineData: { mimeType: mimeType, data: base64Data } }] }
          ]
        });

        res.json({ text: response.text || "" });
      }
    } catch (err: any) {
      console.error("Gagal generate storyline script:", err);
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  // POST endpoint to generate a coherent storytelling sequence from multiple image panels (multi input)
  app.post("/api/batch-generate-storyline", async (req, res) => {
    const { images, genre, promptExtra } = req.body;
    const apiKey = (req.headers["x-gemini-api-key"] as string || "").trim();

    if (!apiKey) {
      res.status(400).json({ error: "Kunci API Gemini pengguna diperlukan! Silakan masukkan API Key Gemini Anda di menu Pengaturan (ikon roda gigi di kanan atas)." });
      return;
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      res.status(400).json({ error: "Daftar gambar panel komik (multi input) belum disediakan." });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const parts: any[] = [];
      images.forEach((img: string, idx: number) => {
        const { mimeType, data: base64Data } = parseDataUri(img);
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      });

      const systemPrompt = `Kamu adalah Penulis Alur Cerita Webtoon/Manhwa Profesional. 
Diberikan ${images.length} potongan gambar scene komik yang tersusun secara berurutan.
Analisis semua gambar ini secara runut, lalu buatlah satu alur cerita (STORYLINE) yang utuh, mengalir secara logis, dramatis, dan sangat koheren dari awal panel hingga panel terakhir.

Informasi Genre Tambahan: ${genre || "Action/Fantasy/Drama"}.
Instruksi Khusus Pengguna: ${promptExtra || "Tulis percakapan yang epik dan natural."}

Keluarkan hasil berupa JSON berstruktur yang berisi:
1. "scenes": Array objek sebanyak jumlah gambar input (${images.length}), sesuai urutan input gambar masing-masing.
Setiap objek scene berisi:
- "title": Judul khas adegan pendek (maksimal 4 kata).
- "narration": Teks narator dramatis puitis dalam BAHASA INDONESIA, diucapkan saat adegan berjalan (1-2 kalimat).
- "bubbles": Daftar balon kata interaktif (0 sampai 2 balon) berisi teks percakapan karakter ("text"), jenis balon kata ("type": "default" (normal), "shout" (teriakan), "whisper" (bisikan), atau "narrator" (boks narasi)), perkiraan posisi horizontal "x" (persentase 15 hingga 85), posisi vertikal "y" (persentase 15 hingga 85), dan "scale" (0.9 hingga 1.2).`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            description: "List of storyline scenes corresponding in 1:1 order to each input image panel.",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Elegant title for this specific panel scene (max 4 words in Indonesian)" },
                narration: { type: Type.STRING, description: "A dramatic, poetic narrative voiceover script in Indonesian (1-2 sentences) suited for this scene." },
                bubbles: {
                  type: Type.ARRAY,
                  description: "Character dialog speech bubbles visible in this panel scene. Provide 0 to 2 bubbles maximum based on characters present.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING, description: "Indonesian dialog line (brief, clear, punchy)" },
                      type: { 
                        type: Type.STRING, 
                        description: "Type of speech bubble. Must be exactly one of: default, shout, whisper, narrator" 
                      },
                      x: { type: Type.INTEGER, description: "Estimated x position percentage (15 to 85) on the canvas" },
                      y: { type: Type.INTEGER, description: "Estimated y position percentage (15 to 85) on the canvas" },
                      scale: { type: Type.NUMBER, description: "Dialog bubble scale (range 0.8 to 1.25)" }
                    },
                    required: ["text", "type", "x", "y", "scale"]
                  }
                }
              },
              required: ["title", "narration", "bubbles"]
            }
          }
        },
        required: ["scenes"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          ...parts,
          { text: systemPrompt }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.75,
        }
      });

      let responseText = response.text || "";
      if (!responseText) {
        throw new Error("Gemini tidak dapat mengembalikan teks respon untuk alur cerita.");
      }

      const cleanJson = JSON.parse(responseText.trim());
      res.json(cleanJson);
    } catch (err: any) {
      console.error("Gagal generate batch storyline:", err);
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  // POST endpoint to extend image bounds to 16:9 using Gemini 3.1 Flash Lite Image editing
  app.post("/api/extend-image", async (req, res) => {
    const { image, prompt } = req.body;
    const apiKey = (req.headers["x-gemini-api-key"] as string || "").trim();

    if (!apiKey) {
      res.status(400).json({ error: "Kunci API Gemini pengguna diperlukan! Silakan masukkan API Key Gemini Anda di menu Pengaturan (ikon roda gigi di kanan atas)." });
      return;
    }

    if (!image) {
      res.status(400).json({ error: "Gambar yang akan diperluas belum disediakan." });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const { mimeType, data: base64Data } = parseDataUri(image);
      let response;
      const imageModels = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];
      let lastErr: any = null;

      for (const modelName of imageModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                { inlineData: { data: base64Data, mimeType: mimeType } },
                { text: prompt || "Extend this image into a cinematic 16:9 widescreen format." }
              ]
            },
            config: {
              imageConfig: {
                aspectRatio: '16:9'
              }
            }
          });
          if (response) break;
        } catch (err: any) {
          lastErr = err;
          // If it's a 429 / quota error, don't spam console.warn with full stack traces
          const isQuota = String(err?.message || "").includes("429") || String(err?.message || "").includes("RESOURCE_EXHAUSTED");
          if (!isQuota) {
            console.warn(`Model ${modelName} failed for image extension:`, err?.message || err);
          }
        }
      }

      if (!response && lastErr) {
        throw lastErr;
      }

      let generatedImageBase64 = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data;
          break;
        }
      }

      if (!generatedImageBase64) {
        throw new Error("Respon model tidak valid. Tidak ada data gambar baru yang dihasilkan.");
      }

      res.json({ image: `data:${mimeType};base64,${generatedImageBase64}` });
    } catch (err: any) {
      console.error("Gagal melakukan perluasan gambar:", err);
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  // POST endpoint to generate short video scripts for TikTok/Reels/Shorts
  app.post("/api/generate-video-script", async (req, res) => {
    const { idea, duration, platform, tone } = req.body;
    const { apiKey, provider, customEndpoint, customModel } = getApiKeyAndProvider(req);

    if (!apiKey) {
      res.status(400).json({ error: "Kunci API pengguna diperlukan! Silakan masukkan API Key Anda di menu Pengaturan (ikon roda gigi di kanan atas)." });
      return;
    }

    if (!idea || !idea.trim()) {
      res.status(400).json({ error: "Ide cerita belum diisi." });
      return;
    }

    try {
      const prompt = `Kamu adalah pembuat konten video pendek viral (${platform || "TikTok/Reels/Shorts"}) spesialis recap komik/anime.
Buatkan skrip video pendek berdurasi sekitar ${duration || "30 detik"} dengan nada bicara ${tone || "Dramatis & Epik"}.
Ide / topik utama: "${idea}".

Format keluaran HARUS dalam markdown Bahasa Indonesia yang rapi dengan struktur:
1. **HOOK (3 Detik Pertama)**: Kalimat pembuka yang sangat memikat perhatian penonton.
2. **ADENGAN & VOICEOVER (Scene by Scene)**:
   - **Scene 1 (0-5s)**: [Visual: ...] | [Voiceover: ...] | [Teks Layar: ...]
   - **Scene 2 (5-15s)**: [Visual: ...] | [Voiceover: ...] | [Teks Layar: ...]
   - dst...
3. **CALL TO ACTION (Penutup)**: Ajakan untuk follow / like / komen pendapat mereka.
4. **TEKS NASKAH UTUH UNTUK VOICEOVER**: Gabungan seluruh kalimat narasi voiceover secara lengkap dari awal hingga akhir agar siap di-copy ke Text to Speech (TTS).`;

      if (provider === "groq") {
        const script = await callOpenAICompatibleAPI({
          apiKey,
          endpoint: "https://api.groq.com/openai/v1/chat/completions",
          model: customModel || "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }]
        });
        res.json({ script });
      } else if (provider === "kie" || provider === "openai" || provider === "custom") {
        const endpoint = customEndpoint || "https://api.kie.ai/v1/chat/completions";
        const model = customModel || "gpt-4o-mini";
        const script = await callOpenAICompatibleAPI({
          apiKey,
          endpoint,
          model,
          messages: [{ role: "user", content: prompt }]
        });
        res.json({ script });
      } else {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt
        });

        res.json({ script: response.text || "" });
      }
    } catch (err: any) {
      console.error("Gagal generate video script:", err);
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  // POST endpoint to generate single panel script with context continuity
  app.post("/api/generate-single-panel-script", async (req, res) => {
    const { image, panelIndex, totalPanels, previousScript, nextScript, allContext, style } = req.body;
    const { apiKey, provider, customEndpoint, customModel } = getApiKeyAndProvider(req);

    if (!apiKey) {
      res.status(400).json({ error: "Kunci API pengguna diperlukan! Silakan masukkan API Key Anda di menu Pengaturan (ikon roda gigi di kanan atas)." });
      return;
    }

    if (!image) {
      res.status(400).json({ error: "Gambar panel komik belum disediakan." });
      return;
    }

    try {
      const { mimeType, data: base64Data } = parseDataUri(image);

      const promptText = `Kamu adalah Penulis Alur Cerita Komik & Manga Sinematik Profesional.
Analisis gambar panel komik ini (Panel ke-${(panelIndex || 0) + 1} dari total ${totalPanels || 1} panel).

Tugas Utama:
Buatkan naskah narasi yang RINGKAS, PADAT, TO THE POINT, NAMUN TETAP LENGKAP merangkum adegan dan dialog di gambar ini.

Aturan Penting & Konsistensi:
1. PANJANG: Maksimal 2 hingga 4 kalimat pendek yang padat dan langsung ke inti alur cerita. DILARANG BERTELE-TELE atau menggunakan kalimat bunga-bunga/puitis yang terlalu panjang!
2. BACALAH teks dialog pada balon kata dalam gambar untuk mengenali NAMA KARAKTER secara tepat (misalnya Ren, Anastasia, Takemichi, Hinata, Pah-chin, Peh-yan, Draken, Chifuyu, Mikey, dll). DILARANG KERAS mengubah, mengarang (halusinasi nama baru), atau melupakan nama karakter!
3. SAMBUNGKAN ALUR CERITA: Naskah ini harus bersambung secara konsisten dan logis dengan alur naskah sebelum dan sesudahnya:
${previousScript ? `- Naskah Tepat Sebelum Ini: "${previousScript}"` : ""}
${nextScript ? `- Naskah Tepat Setelah Ini: "${nextScript}"` : ""}
${allContext ? `- Ringkasan Alur Cerita Sejauh Ini:\n${allContext}` : ""}

4. Gaya Bahasa: ${style === 'santai' ? 'Santai, Natural, dan Ringkas' : 'Baku, Formal, Sinematik, dan Langsung ke Inti (To the Point)'}.
5. SANGAT DILARANG menggunakan kata '[Panel 1]', 'Panel #1', 'Pada gambar ini', 'Di panel ini', atau ulasan meta.
6. Hasilkan HANYA 1 PARAGRAF TEKS NARASI CERITA MURNI (2-4 kalimat) yang siap dibaca untuk Voiceover / Text-to-Speech (TTS).`;

      if (provider === "groq") {
        const text = await callOpenAICompatibleAPI({
          apiKey,
          endpoint: "https://api.groq.com/openai/v1/chat/completions",
          model: customModel || "llama-3.2-11b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
              ]
            }
          ]
        });
        res.json({ script: text.trim() });
      } else if (provider === "kie" || provider === "openai" || provider === "custom") {
        const endpoint = customEndpoint || "https://api.kie.ai/v1/chat/completions";
        const model = customModel || "gpt-4o-mini";
        const text = await callOpenAICompatibleAPI({
          apiKey,
          endpoint,
          model,
          messages: [{ role: "user", content: promptText }]
        });
        res.json({ script: text.trim() });
      } else {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            { parts: [{ text: promptText }, { inlineData: { mimeType, data: base64Data } }] }
          ]
        });

        res.json({ script: (response.text || "").trim() });
      }
    } catch (err: any) {
      console.error("Gagal generate single panel script:", err);
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  // POST endpoint to generate manga script from multiple panels
  app.post("/api/generate-manga-script", async (req, res) => {
    const { images, style, wordCount, useHook, useOutro } = req.body;
    const { apiKey, provider, customEndpoint, customModel } = getApiKeyAndProvider(req);

    if (!apiKey) {
      res.status(400).json({ error: "Kunci API pengguna diperlukan! Silakan masukkan API Key Anda di menu Pengaturan (ikon roda gigi di kanan atas)." });
      return;
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      res.status(400).json({ error: "Gambar panel manga belum diunggah." });
      return;
    }

    try {
      const parts: any[] = [];
      images.forEach((img: string) => {
        const { mimeType, data: base64Data } = parseDataUri(img);
        parts.push({
          inlineData: { mimeType, data: base64Data }
        });
      });

      const promptText = `Kamu adalah Penulis & Narator Cerita Komik / Manga / Manhwa Sinematik Profesional.
Analisis ${images.length} gambar panel komik/manga ini secara berurutan dari panel pertama hingga panel terakhir.

Tugas Utama:
1. BACALAH teks dialog pada balon kata dalam seluruh gambar untuk mengenali NAMA KARAKTER secara akurat. DILARANG KERAS mengubah, mengarang (halusinasi nama baru), atau melupakan nama karakter (misalnya Ren, Anastasia, Takemichi, Hinata, Pah-chin, Peh-yan, Draken, Chifuyu, Mikey, dll).
2. Buatkan naskah narasi cerita yang RINGKAS, PADAT, TO THE POINT, NAMUN TETAP LENGKAP merangkum adegan dan dialog utama.
3. DILARANG BERTELE-TELE: Setiap paragraf narasi (untuk 1 panel) HARUS BERISI 2 HINGGA 4 KALIMAT SINGKAT yang langsung menceritakan poin penting adegan.
4. DILARANG KERAS menggunakan kata 'Panel 1', '[Panel 1]', 'Di gambar ini', 'Pada panel ini', atau ulasan meta/basa-basi.
5. Gaya Bahasa: ${style === 'santai' ? 'Santai, Natural, dan Ringkas' : 'Baku, Formal, Sinematik, dan Langsung ke Inti (To the Point)'}.
6. Tuliskan tepat ${images.length} paragraf narasi murni secara berurutan, di mana 1 paragraf menceritakan adegan pada 1 gambar panel secara presisi.

Keluarkan hasil berupa JSON berstruktur:
{
  "scripts": ["Paragraf narasi ringkas untuk panel 1 (2-4 kalimat)", "Paragraf narasi ringkas untuk panel 2 (2-4 kalimat)", ...]
}
Array "scripts" HARUS memiliki panjang tepat ${images.length} elemen yang bersambung alurnya!`;

      if (provider === "groq") {
        const rawResponse = await callOpenAICompatibleAPI({
          apiKey,
          endpoint: "https://api.groq.com/openai/v1/chat/completions",
          model: customModel || "llama-3.2-11b-vision-preview",
          responseFormatJson: true,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                ...images.map((img: string) => {
                  const { mimeType, data: base64Data } = parseDataUri(img);
                  return { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } };
                })
              ]
            }
          ]
        });
        let scriptsArray: string[] = [];
        try {
          const parsed = JSON.parse(rawResponse);
          if (Array.isArray(parsed.scripts)) scriptsArray = parsed.scripts;
        } catch {
          scriptsArray = rawResponse.split("\n\n").filter(Boolean);
        }
        res.json({ script: scriptsArray.join("\n\n"), scripts: scriptsArray });
      } else if (provider === "kie" || provider === "openai" || provider === "custom") {
        const endpoint = customEndpoint || "https://api.kie.ai/v1/chat/completions";
        const model = customModel || "gpt-4o-mini";
        const rawResponse = await callOpenAICompatibleAPI({
          apiKey,
          endpoint,
          model,
          responseFormatJson: true,
          messages: [{ role: "user", content: promptText }]
        });
        let scriptsArray: string[] = [];
        try {
          const parsed = JSON.parse(rawResponse);
          if (Array.isArray(parsed.scripts)) scriptsArray = parsed.scripts;
        } catch {
          scriptsArray = rawResponse.split("\n\n").filter(Boolean);
        }
        res.json({ script: scriptsArray.join("\n\n"), scripts: scriptsArray });
      } else {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            scripts: {
              type: Type.ARRAY,
              description: `List of exactly ${images.length} narrative paragraphs corresponding 1:1 to each input image panel in order.`,
              items: { type: Type.STRING }
            }
          },
          required: ["scripts"]
        };

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            ...parts,
            { text: promptText }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.7,
          }
        });

        let jsonResult: { scripts?: string[] } = {};
        try {
          jsonResult = JSON.parse(response.text || "{}");
        } catch (e) {
          console.warn("Gagal parse JSON dari Gemini, fallback to text splitting", e);
        }

        let scriptsArray = jsonResult.scripts || [];
        if (!Array.isArray(scriptsArray) || scriptsArray.length === 0) {
          const rawText = response.text || "";
          scriptsArray = rawText.split('\n\n').filter(p => p.trim().length > 0);
        }

        const fullScriptText = scriptsArray.join('\n\n');

        res.json({ 
          script: fullScriptText,
          scripts: scriptsArray 
        });
      }
    } catch (err: any) {
      console.error("Gagal generate manga script:", err);
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
    });
  } else if (!process.env.VERCEL) {
    app.use(express.static(path.join(currentDir, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(currentDir, "dist", "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;

