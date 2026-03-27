var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  name: () => name
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var name = "minimax-music";
var Config = import_koishi.Schema.object({
  apiKey: import_koishi.Schema.string().role("secret").required().description("MiniMax API \u5BC6\u94A5"),
  model: import_koishi.Schema.union([
    import_koishi.Schema.const("music-2.5+").description("music-2.5+\uFF08\u63A8\u8350\uFF09"),
    import_koishi.Schema.const("music-2.5").description("music-2.5")
  ]).default("music-2.5+").description("\u4F7F\u7528\u7684\u6A21\u578B"),
  outputFormat: import_koishi.Schema.union([
    import_koishi.Schema.const("hex").description("HEX\uFF08\u9ED8\u8BA4\uFF09"),
    import_koishi.Schema.const("url").description("URL\uFF0824\u5C0F\u65F6\u6709\u6548\uFF09")
  ]).default("hex").description("\u97F3\u9891\u8F93\u51FA\u683C\u5F0F"),
  sampleRate: import_koishi.Schema.union([
    import_koishi.Schema.const(16e3).description("16000 Hz"),
    import_koishi.Schema.const(24e3).description("24000 Hz"),
    import_koishi.Schema.const(32e3).description("32000 Hz"),
    import_koishi.Schema.const(44100).description("44100 Hz\uFF08\u63A8\u8350\uFF09")
  ]).default(44100).description("\u91C7\u6837\u7387"),
  bitrate: import_koishi.Schema.union([
    import_koishi.Schema.const(32e3).description("32 kbps"),
    import_koishi.Schema.const(64e3).description("64 kbps"),
    import_koishi.Schema.const(128e3).description("128 kbps"),
    import_koishi.Schema.const(256e3).description("256 kbps\uFF08\u63A8\u8350\uFF09")
  ]).default(256e3).description("\u6BD4\u7279\u7387"),
  audioFormat: import_koishi.Schema.union([
    import_koishi.Schema.const("mp3").description("MP3\uFF08\u63A8\u8350\uFF09"),
    import_koishi.Schema.const("wav").description("WAV"),
    import_koishi.Schema.const("pcm").description("PCM")
  ]).default("mp3").description("\u97F3\u9891\u7F16\u7801\u683C\u5F0F"),
  aigcWatermark: import_koishi.Schema.boolean().default(false).description("\u662F\u5426\u6DFB\u52A0 AIGC \u6C34\u5370"),
  lyricsOptimizer: import_koishi.Schema.boolean().default(false).description("\u662F\u5426\u6839\u636E prompt \u81EA\u52A8\u751F\u6210\u6B4C\u8BCD"),
  autoOptimizeLyrics: import_koishi.Schema.boolean().default(false).description("\u662F\u5426\u5F00\u542F\u81EA\u52A8AI\u4F18\u5316\u6B4C\u8BCD\uFF08\u63A5\u6536\u7528\u6237\u6B4C\u8BCD\u540E\u81EA\u52A8\u8C03\u7528API\u8FDB\u884C\u683C\u5F0F\u4F18\u5316\uFF09"),
  sendAsFile: import_koishi.Schema.boolean().default(false).description("\u662F\u5426\u4EE5\u6587\u4EF6\u5F62\u5F0F\u53D1\u9001\u97F3\u9891\uFF08\u9002\u7528\u4E8E silk \u8F6C\u6362\u5931\u8D25\u7684\u73AF\u5883\uFF09"),
  cacheDir: import_koishi.Schema.string().default("data/minimax-music/").description("\u97F3\u9891\u7F13\u5B58\u76EE\u5F55"),
  cleanupHours: import_koishi.Schema.number().default(24).description("\u7F13\u5B58\u6E05\u7406\u95F4\u9694\uFF08\u5C0F\u65F6\uFF09"),
  requestTimeout: import_koishi.Schema.number().default(600).description("\u8BF7\u6C42\u8D85\u65F6\u65F6\u95F4\uFF08\u79D2\uFF0C\u9ED8\u8BA4600\u79D2\uFF09"),
  thinkingMessageDelay: import_koishi.Schema.number().default(15).description("\u663E\u793A\u601D\u8003\u6D88\u606F\u7684\u5EF6\u8FDF\uFF08\u79D2\uFF09"),
  thinkingMessageEnabled: import_koishi.Schema.boolean().default(true).description("\u662F\u5426\u663E\u793A\u601D\u8003\u6D88\u606F")
});
var MUSIC_API_ENDPOINT = "https://api.minimaxi.com/v1/music_generation";
var LYRICS_API_ENDPOINT = "https://api.minimaxi.com/v1/lyrics_generation";
var ERROR_MESSAGES = {
  1002: "\u89E6\u53D1\u9650\u6D41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5",
  1004: "API Key \u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E",
  1008: "\u8D26\u53F7\u4F59\u989D\u4E0D\u8DB3",
  1026: "\u5185\u5BB9\u6D89\u53CA\u654F\u611F\u4FE1\u606F",
  2013: "\u53C2\u6570\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u8F93\u5165",
  2049: "\u65E0\u6548\u7684 API Key"
};
function handleError(code, msg) {
  return ERROR_MESSAGES[code] || `\u751F\u6210\u5931\u8D25: ${msg}`;
}
function getExtension(format) {
  const map = {
    mp3: "mp3",
    wav: "wav",
    pcm: "pcm"
  };
  return map[format] || "mp3";
}
async function convertToSilk(audioBuffer, mimeType, logger) {
  try {
    const silk = await import("silk-wasm");
    if (mimeType.includes("mp3") || mimeType.includes("mpeg")) {
      logger.info("mp3 \u683C\u5F0F\u6682\u4E0D\u652F\u6301 silk \u8F6C\u6362\uFF0C\u8FD4\u56DE\u539F\u59CB\u683C\u5F0F");
      return null;
    }
    if (silk.isWav(audioBuffer)) {
      const info = silk.getWavFileInfo(audioBuffer);
      const result2 = await silk.encode(audioBuffer, info.fmt.sampleRate);
      logger.info(`\u8F6C\u6362\u4E3A silk \u6210\u529F\uFF0C\u65F6\u957F: ${result2.duration}ms`);
      return Buffer.from(result2.data);
    }
    const result = await silk.encode(audioBuffer, 44100);
    logger.info(`\u8F6C\u6362\u4E3A silk \u6210\u529F\uFF0C\u65F6\u957F: ${result.duration}ms`);
    return Buffer.from(result.data);
  } catch (err) {
    logger.warn(`silk \u8F6C\u6362\u5931\u8D25\uFF0C\u4F7F\u7528\u539F\u59CB\u683C\u5F0F: ${err}`);
    return null;
  }
}
var LYRICS_OPTIMIZE_PROMPT_TEMPLATE = `\u8BF7\u4F18\u5316\u4EE5\u4E0B\u6B4C\u8BCD\u7684\u683C\u5F0F\uFF0C\u53EA\u505A\u683C\u5F0F\u8C03\u6574\uFF0C\u4E0D\u8981\u6539\u53D8\u6B4C\u8BCD\u5185\u5BB9\uFF1A
1. \u4FDD\u7559\u6240\u6709\u6B4C\u8BCD\u6587\u5B57\u5185\u5BB9\u4E0D\u53D8
2. \u6DFB\u52A0\u9002\u5F53\u7684\u7ED3\u6784\u6807\u7B7E\u5982 [Verse], [Chorus], [Bridge] \u7B49
3. \u786E\u4FDD\u6B4C\u8BCD\u683C\u5F0F\u9002\u5408\u97F3\u4E50\u751F\u6210
4. \u4FDD\u6301\u6B4C\u8BCD\u7684\u97F5\u5F8B\u548C\u8282\u594F\u611F
5. \u5982\u679C\u6B4C\u8BCD\u6709\u91CD\u590D\u90E8\u5206\uFF0C\u4F7F\u7528\u7ED3\u6784\u6807\u7B7E\u533A\u5206

\u6B4C\u8BCD\u4E3B\u9898\uFF1A{prompt}`;
async function optimizeLyrics(ctx, config, prompt, userLyrics, logger) {
  try {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    };
    const optimizePrompt = LYRICS_OPTIMIZE_PROMPT_TEMPLATE.replace("{prompt}", prompt);
    logger.info("========== \u6B4C\u8BCD\u4F18\u5316\u5F00\u59CB ==========");
    logger.info(`\u539F\u59CBPrompt: ${prompt}`);
    logger.info(`\u6B4C\u8BCD\u957F\u5EA6: ${userLyrics.length} \u5B57\u7B26`);
    logger.info(`\u539F\u59CB\u6B4C\u8BCD\u9884\u89C8: ${userLyrics.substring(0, 200)}...`);
    const payload = {
      model: config.model,
      mode: "edit",
      prompt: optimizePrompt,
      lyrics: userLyrics,
      "lyrics-optimizer": false,
      stream: false
    };
    logger.info("\u53D1\u9001\u6B4C\u8BCD\u4F18\u5316\u8BF7\u6C42...");
    const res = await ctx.http.post(LYRICS_API_ENDPOINT, payload, {
      headers,
      timeout: config.requestTimeout * 1e3
    });
    logger.info(`API\u54CD\u5E94: status_code=${res.base_resp?.status_code}, trace_id=${res.trace_id}, hasLyrics=${!!res.lyrics}`);
    if (!res.base_resp || res.base_resp.status_code !== 0) {
      const code = res.base_resp?.status_code || -1;
      const msg = res.base_resp?.status_msg || "\u672A\u77E5\u9519\u8BEF";
      logger.error(`\u6B4C\u8BCD\u4F18\u5316API\u9519\u8BEF [${code}]: ${msg}`);
      return { error: handleError(code, msg) };
    }
    if (res.lyrics) {
      logger.info("\u6B4C\u8BCD\u4F18\u5316\u5B8C\u6210\uFF08\u540C\u6B65\u8FD4\u56DE\uFF09");
      logger.info(`\u4F18\u5316\u540E\u6B4C\u8BCD\u9884\u89C8: ${res.lyrics.substring(0, 200)}...`);
      logger.info(`\u751F\u6210\u6B4C\u540D: ${res.song_title}`);
      logger.info(`\u751F\u6210\u98CE\u683C: ${res.style_tags}`);
      logger.info("========== \u6B4C\u8BCD\u4F18\u5316\u7ED3\u675F ==========");
      return {
        lyrics: res.lyrics,
        title: res.song_title,
        styleTags: res.style_tags
      };
    }
    if (res.data?.status === 2) {
      logger.info("\u6B4C\u8BCD\u4F18\u5316\u5B8C\u6210\uFF08\u5F02\u6B65\u5B8C\u6210\uFF09");
      logger.info(`\u4F18\u5316\u540E\u6B4C\u8BCD\u9884\u89C8: ${res.data.lyrics?.substring(0, 200)}...`);
      logger.info(`\u751F\u6210\u6B4C\u540D: ${res.data.song_title}`);
      logger.info(`\u751F\u6210\u98CE\u683C: ${res.data.style_tags}`);
      logger.info("========== \u6B4C\u8BCD\u4F18\u5316\u7ED3\u675F ==========");
      return {
        lyrics: res.data.lyrics,
        title: res.data.song_title,
        styleTags: res.data.style_tags
      };
    }
    if (res.data?.status === 1 && res.trace_id) {
      logger.info(`\u6B4C\u8BCD\u4F18\u5316\u8FDB\u884C\u4E2D\uFF0Ctrace_id: ${res.trace_id}\uFF0C\u5F00\u59CB\u8F6E\u8BE2...`);
      const maxAttempts = 60;
      const pollInterval = 5e3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        try {
          const pollRes = await ctx.http.post(
            LYRICS_API_ENDPOINT,
            { model: config.model, trace_id: res.trace_id },
            { headers }
          );
          logger.info(`\u8F6E\u8BE2\u7B2C${attempt}\u6B21\uFF0Cstatus=${pollRes.data?.status}, hasLyrics=${!!pollRes.lyrics}`);
          if (pollRes.lyrics) {
            logger.info("\u6B4C\u8BCD\u4F18\u5316\u5B8C\u6210\uFF08\u8F6E\u8BE2-\u540C\u6B65\u8FD4\u56DE\uFF09");
            logger.info(`\u4F18\u5316\u540E\u6B4C\u8BCD\u9884\u89C8: ${pollRes.lyrics.substring(0, 200)}...`);
            logger.info(`\u751F\u6210\u6B4C\u540D: ${pollRes.song_title}`);
            logger.info(`\u751F\u6210\u98CE\u683C: ${pollRes.style_tags}`);
            logger.info("========== \u6B4C\u8BCD\u4F18\u5316\u7ED3\u675F ==========");
            return {
              lyrics: pollRes.lyrics,
              title: pollRes.song_title,
              styleTags: pollRes.style_tags
            };
          }
          if (pollRes.data?.status === 2) {
            logger.info("\u6B4C\u8BCD\u4F18\u5316\u5B8C\u6210\uFF08\u8F6E\u8BE2\uFF09");
            logger.info(`\u4F18\u5316\u540E\u6B4C\u8BCD\u9884\u89C8: ${pollRes.data.lyrics?.substring(0, 200)}...`);
            logger.info(`\u751F\u6210\u6B4C\u540D: ${pollRes.data.song_title}`);
            logger.info(`\u751F\u6210\u98CE\u683C: ${pollRes.data.style_tags}`);
            logger.info("========== \u6B4C\u8BCD\u4F18\u5316\u7ED3\u675F ==========");
            return {
              lyrics: pollRes.data.lyrics,
              title: pollRes.data.song_title,
              styleTags: pollRes.data.style_tags
            };
          }
          if (pollRes.data?.status === 3) {
            logger.error("\u6B4C\u8BCD\u4F18\u5316\u5931\u8D25: \u4EFB\u52A1\u5931\u8D25");
            logger.info("========== \u6B4C\u8BCD\u4F18\u5316\u7ED3\u675F ==========");
            return { error: "\u6B4C\u8BCD\u4F18\u5316\u4EFB\u52A1\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5" };
          }
        } catch (pollErr) {
          logger.warn(`\u8F6E\u8BE2\u8BF7\u6C42\u5931\u8D25: ${pollErr}`);
        }
      }
      logger.error("\u6B4C\u8BCD\u4F18\u5316\u8D85\u65F6");
      logger.info("========== \u6B4C\u8BCD\u4F18\u5316\u7ED3\u675F ==========");
      return { error: "\u6B4C\u8BCD\u4F18\u5316\u8D85\u65F6\uFF0C\u8BF7\u91CD\u8BD5" };
    }
    logger.warn("\u6B4C\u8BCD\u4F18\u5316\u54CD\u5E94\u5F02\u5E38:", JSON.stringify(res));
    logger.info("========== \u6B4C\u8BCD\u4F18\u5316\u7ED3\u675F ==========");
    return { error: "\u6B4C\u8BCD\u4F18\u5316\u72B6\u6001\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5" };
  } catch (err) {
    logger.error("\u6B4C\u8BCD\u4F18\u5316\u5931\u8D25:", err);
    logger.info("========== \u6B4C\u8BCD\u4F18\u5316\u7ED3\u675F ==========");
    if (err instanceof Error) {
      return { error: `\u6B4C\u8BCD\u4F18\u5316\u5931\u8D25: ${err.message}` };
    }
    return { error: "\u6B4C\u8BCD\u4F18\u5316\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" };
  }
}
function cleanLyrics(lyrics) {
  if (!lyrics) return "";
  return lyrics.replace(/\\n/g, "\n").trim();
}
async function cleanupCache(cacheDir, hours) {
  try {
    const exists = await fs.promises.access(cacheDir).then(() => true).catch(() => false);
    if (!exists) return;
    const now = Date.now();
    const maxAge = hours * 60 * 60 * 1e3;
    const files = await fs.promises.readdir(cacheDir);
    for (const file of files) {
      if (!file.startsWith("music_")) continue;
      const filepath = path.join(cacheDir, file);
      try {
        const stat = await fs.promises.stat(filepath);
        if (now - stat.mtimeMs > maxAge) {
          await fs.promises.unlink(filepath);
        }
      } catch {
      }
    }
  } catch {
  }
}
function apply(ctx, config) {
  const logger = ctx.logger("minimax-music");
  const userContexts = /* @__PURE__ */ new Map();
  ctx.on("ready", async () => {
    try {
      await fs.promises.mkdir(config.cacheDir, { recursive: true });
      logger.info(`\u7F13\u5B58\u76EE\u5F55\u5DF2\u51C6\u5907: ${config.cacheDir}`);
    } catch (err) {
      logger.error(`\u521B\u5EFA\u7F13\u5B58\u76EE\u5F55\u5931\u8D25: ${err}`);
    }
  });
  ctx.setInterval(() => {
    cleanupCache(config.cacheDir, config.cleanupHours);
  }, 60 * 60 * 1e3);
  function sendThinkingMessage(session) {
    const messageIds = [];
    let sent = false;
    if (config.thinkingMessageEnabled) {
      setTimeout(async () => {
        if (sent) return;
        try {
          const ids = await session.send("\u{1F3B5} \u6B63\u5728\u751F\u6210\u97F3\u4E50\uFF0C\u8BF7\u7A0D\u5019...\uFF08\u8FD9\u53EF\u80FD\u9700\u8981\u4E00\u5206\u949F\u6216\u66F4\u4E45\uFF09");
          messageIds.push(...Array.isArray(ids) ? ids : [ids]);
          logger.info("\u5DF2\u53D1\u9001\u601D\u8003\u6D88\u606F\uFF0CmessageIds:", messageIds);
          setTimeout(async () => {
            for (const mid of messageIds) {
              try {
                await session.bot.deleteMessage(session.channelId, mid);
              } catch {
              }
            }
          }, 3 * 60 * 1e3);
        } catch (err) {
          logger.error("\u53D1\u9001\u601D\u8003\u6D88\u606F\u5931\u8D25:", err);
        }
      }, config.thinkingMessageDelay * 1e3);
    }
    return async () => {
      sent = true;
      for (const mid of messageIds) {
        try {
          await session.bot.deleteMessage(session.channelId, mid);
        } catch {
        }
      }
    };
  }
  async function generateMusic(session, prompt, options) {
    const startTime = Date.now();
    const { lyrics, isInstrumental = false, lyricsOptimizer = false, title } = options;
    logger.info(`\u5F00\u59CB\u751F\u6210\u97F3\u4E50\uFF0Cprompt: ${prompt.substring(0, 50)}...`);
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    };
    const payload = {
      model: config.model,
      prompt,
      stream: false,
      output_format: config.outputFormat,
      audio_setting: {
        sample_rate: config.sampleRate,
        bitrate: config.bitrate,
        format: config.audioFormat
      }
    };
    if (isInstrumental) {
      if (!config.model.includes("2.5+")) {
        return { error: "\u7EAF\u97F3\u4E50\u6A21\u5F0F\u4EC5\u652F\u6301 music-2.5+ \u6A21\u578B" };
      }
      payload.is_instrumental = true;
    } else {
      let processedLyrics = lyrics;
      if (processedLyrics) {
        processedLyrics = cleanLyrics(processedLyrics);
        payload.lyrics = processedLyrics;
      } else if (lyricsOptimizer || config.lyricsOptimizer) {
        payload.lyrics_optimizer = true;
      }
    }
    if (config.aigcWatermark) {
      payload.aigc_watermark = true;
    }
    let recallFunc = null;
    try {
      recallFunc = sendThinkingMessage(session);
      logger.info("\u5DF2\u542F\u52A8\u601D\u8003\u6D88\u606F\u5B9A\u65F6\u5668");
      const res = await ctx.http.post(MUSIC_API_ENDPOINT, payload, {
        headers,
        timeout: config.requestTimeout * 1e3
      });
      logger.info("API \u8BF7\u6C42\u5B8C\u6210\uFF0C\u64A4\u56DE\u601D\u8003\u6D88\u606F");
      if (recallFunc) await recallFunc();
      if (!res.base_resp || res.base_resp.status_code !== 0) {
        const code = res.base_resp?.status_code || -1;
        const msg = res.base_resp?.status_msg || "\u672A\u77E5\u9519\u8BEF";
        logger.error(`API \u9519\u8BEF [${code}]: ${msg}`);
        return { error: handleError(code, msg) };
      }
      if (!res.data || res.data.status !== 2) {
        return { error: "\u97F3\u4E50\u751F\u6210\u72B6\u6001\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5" };
      }
      const elapsed = Math.round((Date.now() - startTime) / 1e3);
      logger.info(`\u97F3\u4E50\u751F\u6210\u5B8C\u6210\uFF0C\u8017\u65F6: ${elapsed}\u79D2`);
      if (config.outputFormat === "hex") {
        if (!res.data.audio) {
          return { error: "\u672A\u6536\u5230\u97F3\u9891\u6570\u636E\uFF0C\u8BF7\u91CD\u8BD5" };
        }
        await fs.promises.mkdir(config.cacheDir, { recursive: true });
        const buffer = Buffer.from(res.data.audio, "hex");
        const ext = getExtension(config.audioFormat);
        const filename = `music_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filepath = path.join(config.cacheDir, filename);
        await fs.promises.writeFile(filepath, buffer);
        logger.info(`\u97F3\u9891\u5DF2\u4FDD\u5B58: ${filepath} (${buffer.length} bytes)`);
        const mimeType = ext === "mp3" ? "audio/mpeg" : ext === "wav" ? "audio/wav" : "audio/x-wav";
        logger.info(`\u6784\u5EFA audio \u5143\u7D20\uFF0CBuffer \u5927\u5C0F: ${buffer.length} bytes`);
        if (config.sendAsFile) {
          const safeTitle = title ? title.replace(/[\/\\:*?"<>|]/g, "_").substring(0, 50) : "music";
          const filename2 = `${safeTitle}.${ext}`;
          logger.info(`\u4EE5\u6587\u4EF6\u5F62\u5F0F\u53D1\u9001\uFF0C\u6587\u4EF6\u540D: ${filename2}`);
          return import_koishi.h.file(buffer, mimeType, { filename: filename2 });
        }
        const silkBuffer = await convertToSilk(buffer, mimeType, logger);
        if (silkBuffer) {
          logger.info(`\u4F7F\u7528 silk \u683C\u5F0F\u53D1\u9001\uFF0CBuffer \u5927\u5C0F: ${silkBuffer.length} bytes`);
          return import_koishi.h.audio(silkBuffer, "audio/silk");
        }
        return import_koishi.h.audio(buffer, mimeType);
      } else {
        const audioUrl = res.data.audio;
        if (!audioUrl) {
          return { error: "\u672A\u6536\u5230\u97F3\u9891\u6570\u636E\uFF0C\u8BF7\u91CD\u8BD5" };
        }
        logger.info(`\u4F7F\u7528\u8FD4\u56DE\u7684 URL: ${audioUrl.substring(0, 50)}...`);
        return import_koishi.h.audio(audioUrl);
      }
    } catch (err) {
      if (recallFunc) await recallFunc();
      const elapsed = Math.round((Date.now() - startTime) / 1e3);
      logger.error(`\u751F\u6210\u5931\u8D25 [${elapsed}s]:`, err);
      if (err instanceof Error) {
        if (err.message.includes("UND_ERR_HEADERS_TIMEOUT") || err.message.includes("timeout") || err.message.includes("Timeout")) {
          return { error: `\u8BF7\u6C42\u8D85\u65F6\uFF08${elapsed}\u79D2\uFF09\uFF0CMiniMax \u670D\u52A1\u5668\u54CD\u5E94\u8FC7\u6162\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5` };
        }
        if (err.message.includes("ECONNREFUSED")) {
          return { error: "\u65E0\u6CD5\u8FDE\u63A5\u5230 MiniMax API\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC" };
        }
        if (err.message.includes("ENOTFOUND") || err.message.includes("getaddrinfo")) {
          return { error: "\u65E0\u6CD5\u89E3\u6790 API \u5730\u5740\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC" };
        }
        return { error: `\u751F\u6210\u5931\u8D25: ${err.message}` };
      }
      return { error: "\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" };
    }
  }
  function getUserContext(userId) {
    return userContexts.get(userId);
  }
  function setUserContext(userId, context) {
    userContexts.set(userId, context);
  }
  function clearUserContext(userId) {
    userContexts.delete(userId);
  }
  async function recallWizardMessages(session, context) {
    if (context.wizardMessageIds && context.wizardMessageIds.length > 0) {
      for (const mid of context.wizardMessageIds) {
        try {
          await session.bot.deleteMessage(session.channelId, mid);
        } catch {
        }
      }
      logger.info(`\u5DF2\u64A4\u56DE ${context.wizardMessageIds.length} \u6761\u5411\u5BFC\u6D88\u606F`);
    }
  }
  const helpText = `
\u{1F3B5} **MiniMax \u97F3\u4E50\u751F\u6210\u63D2\u4EF6\u4F7F\u7528\u8BF4\u660E**

**\u547D\u4EE4\u683C\u5F0F:**
\`/music <\u98CE\u683C\u63CF\u8FF0>\`

**\u793A\u4F8B:**
- \`/music \u6D41\u884C\u97F3\u4E50,\u6B22\u5FEB,\u9633\u5149\`
- \`/music \u6292\u60C5\u6447\u6EDA\`

**\u4F7F\u7528\u65B9\u6CD5:**
1. \u8F93\u5165 \`/music\` \u52A0\u98CE\u683C\u63CF\u8FF0
2. \u9009\u62E9\u751F\u6210\u7EAF\u97F3\u4E50\u8FD8\u662F\u5E26\u6B4C\u8BCD\u6B4C\u66F2
3. \u6839\u636E\u9009\u62E9\u5B8C\u6210\u751F\u6210

**\u5176\u4ED6\u547D\u4EE4:**
- \`/music help\` - \u663E\u793A\u5E2E\u52A9
`.trim();
  async function handleMusicWizard(session, prompt) {
    const userId = session.userId;
    const context = {
      prompt: prompt.trim(),
      awaitingChoice: "type",
      wizardMessageIds: []
    };
    setUserContext(userId, context);
    const ids = await session.send(
      `\u{1F3B5} **\u97F3\u4E50\u751F\u6210\u5411\u5BFC**

\u98CE\u683C: ${prompt.trim()}

\u8BF7\u9009\u62E9\u751F\u6210\u7C7B\u578B:
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
1\uFE0F\u20E3 \u8F93\u5165 **Y** \u6216 **\u662F** \u2192 \u751F\u6210\u7EAF\u97F3\u4E50\uFF08\u65E0\u4EBA\u58F0\uFF09
2\uFE0F\u20E3 \u8F93\u5165 **N** \u6216 **\u5426** \u2192 \u751F\u6210\u5E26\u6B4C\u8BCD\u6B4C\u66F2
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u8F93\u5165 "\u53D6\u6D88" \u53EF\u7EC8\u6B62\u64CD\u4F5C`
    );
    context.wizardMessageIds?.push(...Array.isArray(ids) ? ids : [ids]);
  }
  async function handleUserReply(session, text) {
    const userId = session.userId;
    const context = getUserContext(userId);
    if (!context) {
      return;
    }
    const userMsgId = session.messageId || session.msgId;
    if (userMsgId) {
      context.wizardMessageIds = context.wizardMessageIds || [];
      context.wizardMessageIds.push(userMsgId);
    }
    const input = text.trim().toLowerCase();
    if (input === "\u53D6\u6D88" || input === "cancel" || input === "quit") {
      clearUserContext(userId);
      return "\u274C \u5DF2\u53D6\u6D88\u97F3\u4E50\u751F\u6210";
    }
    if (input === "help" || input === "\u5E2E\u52A9") {
      return (0, import_koishi.h)("markdown", { content: helpText });
    }
    switch (context.awaitingChoice) {
      case "type":
        return handleTypeChoice(session, input);
      case "lyrics":
        return handleLyricsChoice(session, input, text);
      default:
        clearUserContext(userId);
        return "\u274C \u64CD\u4F5C\u8D85\u65F6\uFF0C\u8BF7\u91CD\u65B0\u5F00\u59CB";
    }
  }
  async function handleTypeChoice(session, input) {
    const userId = session.userId;
    const context = getUserContext(userId);
    if (!context) return;
    if (input === "y" || input === "\u662F" || input === "yes" || input === "1") {
      context.isInstrumental = true;
      const result = await generateMusic(session, context.prompt, {
        isInstrumental: true
      });
      await recallWizardMessages(session, context);
      clearUserContext(userId);
      if ("error" in result) {
        return `\u274C ${result.error}`;
      }
      return result;
    }
    if (input === "n" || input === "\u5426" || input === "no" || input === "2") {
      if (config.lyricsOptimizer) {
        context.lyricsOptimizer = true;
        const result = await generateMusic(session, context.prompt, {
          lyricsOptimizer: true,
          isInstrumental: false
        });
        await recallWizardMessages(session, context);
        clearUserContext(userId);
        if ("error" in result) {
          return `\u274C ${result.error}`;
        }
        return result;
      }
      context.awaitingChoice = "lyrics";
      const ids = await session.send(
        `\u{1F3A4} **\u6B4C\u8BCD\u8BBE\u7F6E**

\u8BF7\u9009\u62E9\u6B4C\u8BCD\u65B9\u5F0F:
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
1\uFE0F\u20E3 \u8F93\u5165 **\u6B4C\u8BCD\u5185\u5BB9** \u2192 \u4F7F\u7528\u81EA\u5B9A\u4E49\u6B4C\u8BCD
2\uFE0F\u20E3 \u8F93\u5165 **N** \u6216 **\u5426** \u2192 \u81EA\u52A8\u6839\u636E\u98CE\u683C\u751F\u6210\u6B4C\u8BCD
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u8F93\u5165 "\u53D6\u6D88" \u53EF\u7EC8\u6B62\u64CD\u4F5C`
      );
      context.wizardMessageIds?.push(...Array.isArray(ids) ? ids : [ids]);
      return;
    }
    return `\u2753 \u65E0\u6548\u7684\u9009\u62E9\uFF0C\u8BF7\u91CD\u65B0\u8F93\u5165:

1\uFE0F\u20E3 \u8F93\u5165 **Y** \u6216 **\u662F** \u2192 \u751F\u6210\u7EAF\u97F3\u4E50
2\uFE0F\u20E3 \u8F93\u5165 **N** \u6216 **\u5426** \u2192 \u751F\u6210\u5E26\u6B4C\u8BCD\u6B4C\u66F2`;
  }
  async function handleLyricsChoice(session, input, fullText) {
    const userId = session.userId;
    const context = getUserContext(userId);
    if (!context) return;
    if (input === "n" || input === "\u5426" || input === "no") {
      context.lyricsOptimizer = true;
      const result2 = await generateMusic(session, context.prompt, {
        lyricsOptimizer: true,
        isInstrumental: false
      });
      await recallWizardMessages(session, context);
      clearUserContext(userId);
      if ("error" in result2) {
        return `\u274C ${result2.error}`;
      }
      return result2;
    }
    let finalLyrics = fullText.trim();
    if (config.autoOptimizeLyrics) {
      const recallFunc = sendThinkingMessage(session);
      const optimizeMsg = await session.send("\u2728 \u6B63\u5728\u4F7F\u7528AI\u4F18\u5316\u6B4C\u8BCD\u683C\u5F0F...");
      context.wizardMessageIds?.push(...Array.isArray(optimizeMsg) ? optimizeMsg : [optimizeMsg]);
      const optimized = await optimizeLyrics(ctx, config, context.prompt, finalLyrics, logger);
      if (recallFunc) await recallFunc();
      if (optimized.error) {
        const errMsg = await session.send(`\u26A0\uFE0F \u6B4C\u8BCD\u4F18\u5316\u5931\u8D25\uFF0C\u5C06\u4F7F\u7528\u539F\u59CB\u6B4C\u8BCD: ${optimized.error}`);
        context.wizardMessageIds?.push(...Array.isArray(errMsg) ? errMsg : [errMsg]);
      } else if (optimized.lyrics) {
        finalLyrics = optimized.lyrics;
        context.generatedTitle = optimized.title;
        context.generatedStyleTags = optimized.styleTags;
        context.generatedLyrics = optimized.lyrics;
        let response = "\u2728 \u6B4C\u8BCD\u683C\u5F0F\u4F18\u5316\u5B8C\u6210!\n\n";
        if (optimized.title) {
          response += `**\u6B4C\u540D**: ${optimized.title}
`;
        }
        if (optimized.styleTags) {
          response += `**\u98CE\u683C\u6807\u7B7E**: ${optimized.styleTags}
`;
        }
        response += `**\u6B4C\u8BCD\u9884\u89C8**:
\`\`\`
${optimized.lyrics.substring(0, 200)}${optimized.lyrics.length > 200 ? "..." : ""}
\`\`\`

\u6B63\u5728\u751F\u6210\u97F3\u4E50...`;
        const responseMsg = await session.send(response);
        context.wizardMessageIds?.push(...Array.isArray(responseMsg) ? responseMsg : [responseMsg]);
      }
    }
    context.lyrics = finalLyrics;
    context.awaitingChoice = void 0;
    const result = await generateMusic(session, context.prompt, {
      lyrics: context.lyrics,
      isInstrumental: false,
      title: context.generatedTitle
    });
    await recallWizardMessages(session, context);
    clearUserContext(userId);
    if ("error" in result) {
      return `\u274C ${result.error}`;
    }
    return result;
  }
  ctx.command("music [prompt:text]", "MiniMax \u97F3\u4E50\u751F\u6210").example("/music \u6D41\u884C\u97F3\u4E50,\u6B22\u5FEB,\u9633\u5149").action(async (argv, prompt) => {
    const session = argv.session;
    if (!prompt || prompt.toLowerCase() === "help" || prompt.toLowerCase() === "\u5E2E\u52A9") {
      return (0, import_koishi.h)("markdown", { content: helpText });
    }
    if (!prompt?.trim()) {
      return '\u274C \u8BF7\u63D0\u4F9B\u97F3\u4E50\u98CE\u683C\u63CF\u8FF0\n\n\u4F8B\u5982: /music \u6D41\u884C\u97F3\u4E50,\u6B22\u5FEB,\u9633\u5149\n\n\u8F93\u5165 "/music help" \u67E5\u770B\u66F4\u591A\u7528\u6CD5';
    }
    await handleMusicWizard(session, prompt);
  });
  ctx.middleware(async (session, next) => {
    const userId = session.userId;
    const context = getUserContext(userId);
    if (!context) {
      return next();
    }
    const textContent = (session.content || "").trim();
    if (textContent.startsWith("/")) {
      clearUserContext(userId);
      return next();
    }
    const result = await handleUserReply(session, textContent);
    if (result === void 0) {
      return;
    }
    return result;
  }, true);
  ctx.command("music.cancel", "\u53D6\u6D88\u5F53\u524D\u97F3\u4E50\u751F\u6210").action((argv) => {
    const userId = argv.session.userId;
    if (userContexts.has(userId)) {
      userContexts.delete(userId);
      return "\u274C \u5DF2\u53D6\u6D88\u5F53\u524D\u97F3\u4E50\u751F\u6210";
    }
    return "\u274C \u6CA1\u6709\u6B63\u5728\u8FDB\u884C\u7684\u97F3\u4E50\u751F\u6210";
  });
  logger.info("MiniMax Music \u63D2\u4EF6\u5DF2\u52A0\u8F7D");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  name
});
