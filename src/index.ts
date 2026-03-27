import { Context, Schema, h, Session, Element } from 'koishi'
import * as fs from 'fs'
import * as path from 'path'

// silk-wasm 类型声明
declare module 'silk-wasm' {
  export function encode(input: ArrayBufferView | ArrayBuffer, sampleRate: number): Promise<{ data: Uint8Array; duration: number }>
  export function isWav(data: ArrayBufferView | ArrayBuffer): boolean
  export function getWavFileInfo(data: ArrayBufferView | ArrayBuffer): { fmt: { sampleRate: number } }
}

export const name = 'minimax-music'

// 命令结果类型
type CommandResult = string | Element | Element[] | void

// 用户选择状态
interface MusicContext {
  prompt: string  // 用户输入的风格描述
  lyrics?: string  // 用户提供的歌词
  isInstrumental?: boolean  // 是否纯音乐
  lyricsOptimizer?: boolean  // 是否自动生成歌词
  awaitingChoice?: 'type' | 'lyrics' | 'lyrics-edit'  // 当前等待用户输入的类型
  generatedLyrics?: string  // AI 生成的歌词
  generatedTitle?: string  // AI 生成的歌名
  generatedStyleTags?: string  // AI 生成的风格标签
  wizardMessageIds?: string[]  // 向导消息ID列表，用于完成后撤回
}

export interface Config {
  apiKey: string
  model: 'music-2.5+' | 'music-2.5'
  outputFormat: 'url' | 'hex'
  sampleRate: 16000 | 24000 | 32000 | 44100
  bitrate: 32000 | 64000 | 128000 | 256000
  audioFormat: 'mp3' | 'wav' | 'pcm'
  aigcWatermark: boolean
  lyricsOptimizer: boolean
  autoOptimizeLyrics: boolean
  sendAsFile: boolean
  cacheDir: string
  cleanupHours: number
  requestTimeout: number
  thinkingMessageDelay: number
  thinkingMessageEnabled: boolean
}

export const Config: Schema<Config> = Schema.object({
  apiKey: Schema.string().role('secret').required().description('MiniMax API 密钥'),
  model: Schema.union([
    Schema.const('music-2.5+').description('music-2.5+（推荐）'),
    Schema.const('music-2.5').description('music-2.5'),
  ]).default('music-2.5+').description('使用的模型'),
  outputFormat: Schema.union([
    Schema.const('hex').description('HEX（默认）'),
    Schema.const('url').description('URL（24小时有效）'),
  ]).default('hex').description('音频输出格式'),
  sampleRate: Schema.union([
    Schema.const(16000).description('16000 Hz'),
    Schema.const(24000).description('24000 Hz'),
    Schema.const(32000).description('32000 Hz'),
    Schema.const(44100).description('44100 Hz（推荐）'),
  ]).default(44100).description('采样率'),
  bitrate: Schema.union([
    Schema.const(32000).description('32 kbps'),
    Schema.const(64000).description('64 kbps'),
    Schema.const(128000).description('128 kbps'),
    Schema.const(256000).description('256 kbps（推荐）'),
  ]).default(256000).description('比特率'),
  audioFormat: Schema.union([
    Schema.const('mp3').description('MP3（推荐）'),
    Schema.const('wav').description('WAV'),
    Schema.const('pcm').description('PCM'),
  ]).default('mp3').description('音频编码格式'),
  aigcWatermark: Schema.boolean().default(false).description('是否添加 AIGC 水印'),
  lyricsOptimizer: Schema.boolean().default(false).description('是否根据 prompt 自动生成歌词'),
  autoOptimizeLyrics: Schema.boolean().default(false).description('是否开启自动AI优化歌词（接收用户歌词后自动调用API进行格式优化）'),
  sendAsFile: Schema.boolean().default(false).description('是否以文件形式发送音频（适用于 silk 转换失败的环境）'),
  cacheDir: Schema.string().default('data/minimax-music/').description('音频缓存目录'),
  cleanupHours: Schema.number().default(24).description('缓存清理间隔（小时）'),
  requestTimeout: Schema.number().default(600).description('请求超时时间（秒，默认600秒）'),
  thinkingMessageDelay: Schema.number().default(15).description('显示思考消息的延迟（秒）'),
  thinkingMessageEnabled: Schema.boolean().default(true).description('是否显示思考消息'),
})

const MUSIC_API_ENDPOINT = 'https://api.minimaxi.com/v1/music_generation'
const LYRICS_API_ENDPOINT = 'https://api.minimaxi.com/v1/lyrics_generation'

// 歌词生成 API 响应类型
interface LyricsGenerationResponse {
  // 直接在顶层的成功响应格式
  lyrics?: string
  song_title?: string
  style_tags?: string
  // 异步任务的响应格式
  data?: {
    status: number
    lyrics?: string
    song_title?: string
    style_tags?: string
  }
  base_resp?: {
    status_code: number
    status_msg: string
  }
  trace_id?: string
}

// 错误码映射
const ERROR_MESSAGES: Record<number, string> = {
  1002: '触发限流，请稍后再试',
  1004: 'API Key 错误，请检查配置',
  1008: '账号余额不足',
  1026: '内容涉及敏感信息',
  2013: '参数错误，请检查输入',
  2049: '无效的 API Key',
}

function handleError(code: number, msg: string): string {
  return ERROR_MESSAGES[code] || `生成失败: ${msg}`
}

function getExtension(format: string): string {
  const map: Record<string, string> = {
    mp3: 'mp3',
    wav: 'wav',
    pcm: 'pcm',
  }
  return map[format] || 'mp3'
}

/**
 * 将音频转换为 silk 格式（用于 QQ RED 等需要 silk 格式的适配器）
 */
async function convertToSilk(audioBuffer: Buffer, mimeType: string, logger: any): Promise<Buffer | null> {
  try {
    // 动态导入 silk-wasm
    const silk = await import('silk-wasm')

    // 如果是 mp3，先尝试直接编码（silk-wasm 支持直接编码）
    // 否则返回 null，让调用方使用原始格式
    if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
      // mp3 需要先解码为 PCM，这里简化处理，返回 null 使用原始格式
      logger.info('mp3 格式暂不支持 silk 转换，返回原始格式')
      return null
    }

    // 检查是否为 wav 格式
    if (silk.isWav(audioBuffer)) {
      const info = silk.getWavFileInfo(audioBuffer)
      const result = await silk.encode(audioBuffer, info.fmt.sampleRate)
      logger.info(`转换为 silk 成功，时长: ${result.duration}ms`)
      return Buffer.from(result.data)
    }

    // 其他格式，尝试直接编码（假设是 PCM 格式）
    const result = await silk.encode(audioBuffer, 44100)
    logger.info(`转换为 silk 成功，时长: ${result.duration}ms`)
    return Buffer.from(result.data)
  } catch (err) {
    logger.warn(`silk 转换失败，使用原始格式: ${err}`)
    return null
  }
}

// 歌词优化固定Prompt模版
const LYRICS_OPTIMIZE_PROMPT_TEMPLATE = `请优化以下歌词的格式，只做格式调整，不要改变歌词内容：
1. 保留所有歌词文字内容不变
2. 添加适当的结构标签如 [Verse], [Chorus], [Bridge] 等
3. 确保歌词格式适合音乐生成
4. 保持歌词的韵律和节奏感
5. 如果歌词有重复部分，使用结构标签区分

歌词主题：{prompt}`

/**
 * 调用歌词生成API优化歌词格式（仅格式优化，不改变内容）
 */
async function optimizeLyrics(
  ctx: Context,
  config: Config,
  prompt: string,
  userLyrics: string,
  logger: any
): Promise<{ lyrics?: string; title?: string; styleTags?: string; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    }

    // 使用固定模版生成优化Prompt
    const optimizePrompt = LYRICS_OPTIMIZE_PROMPT_TEMPLATE.replace('{prompt}', prompt)

    logger.info('========== 歌词优化开始 ==========')
    logger.info(`原始Prompt: ${prompt}`)
    logger.info(`歌词长度: ${userLyrics.length} 字符`)
    logger.info(`原始歌词预览: ${userLyrics.substring(0, 200)}...`)

    const payload = {
      model: config.model,
      mode: 'edit',
      prompt: optimizePrompt,
      lyrics: userLyrics,
      'lyrics-optimizer': false,
      stream: false,
    }

    logger.info('发送歌词优化请求...')

    const res = await ctx.http.post<LyricsGenerationResponse>(LYRICS_API_ENDPOINT, payload, {
      headers,
      timeout: config.requestTimeout * 1000,
    })

    logger.info(`API响应: status_code=${res.base_resp?.status_code}, trace_id=${res.trace_id}, hasLyrics=${!!res.lyrics}`)

    if (!res.base_resp || res.base_resp.status_code !== 0) {
      const code = res.base_resp?.status_code || -1
      const msg = res.base_resp?.status_msg || '未知错误'
      logger.error(`歌词优化API错误 [${code}]: ${msg}`)
      return { error: handleError(code, msg) }
    }

    // 同步成功：数据直接在顶层返回
    if (res.lyrics) {
      logger.info('歌词优化完成（同步返回）')
      logger.info(`优化后歌词预览: ${res.lyrics.substring(0, 200)}...`)
      logger.info(`生成歌名: ${res.song_title}`)
      logger.info(`生成风格: ${res.style_tags}`)
      logger.info('========== 歌词优化结束 ==========')
      return {
        lyrics: res.lyrics,
        title: res.song_title,
        styleTags: res.style_tags,
      }
    }

    // 异步模式：检查 data 对象的 status 字段
    if (res.data?.status === 2) {
      logger.info('歌词优化完成（异步完成）')
      logger.info(`优化后歌词预览: ${res.data.lyrics?.substring(0, 200)}...`)
      logger.info(`生成歌名: ${res.data.song_title}`)
      logger.info(`生成风格: ${res.data.style_tags}`)
      logger.info('========== 歌词优化结束 ==========')
      return {
        lyrics: res.data.lyrics,
        title: res.data.song_title,
        styleTags: res.data.style_tags,
      }
    }

    // 状态为1表示处理中，需要轮询
    if (res.data?.status === 1 && res.trace_id) {
      logger.info(`歌词优化进行中，trace_id: ${res.trace_id}，开始轮询...`)

      const maxAttempts = 60
      const pollInterval = 5000

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))

        try {
          const pollRes = await ctx.http.post<LyricsGenerationResponse>(
            LYRICS_API_ENDPOINT,
            { model: config.model, trace_id: res.trace_id },
            { headers }
          )

          logger.info(`轮询第${attempt}次，status=${pollRes.data?.status}, hasLyrics=${!!pollRes.lyrics}`)

          // 同步返回格式
          if (pollRes.lyrics) {
            logger.info('歌词优化完成（轮询-同步返回）')
            logger.info(`优化后歌词预览: ${pollRes.lyrics.substring(0, 200)}...`)
            logger.info(`生成歌名: ${pollRes.song_title}`)
            logger.info(`生成风格: ${pollRes.style_tags}`)
            logger.info('========== 歌词优化结束 ==========')
            return {
              lyrics: pollRes.lyrics,
              title: pollRes.song_title,
              styleTags: pollRes.style_tags,
            }
          }

          if (pollRes.data?.status === 2) {
            logger.info('歌词优化完成（轮询）')
            logger.info(`优化后歌词预览: ${pollRes.data.lyrics?.substring(0, 200)}...`)
            logger.info(`生成歌名: ${pollRes.data.song_title}`)
            logger.info(`生成风格: ${pollRes.data.style_tags}`)
            logger.info('========== 歌词优化结束 ==========')
            return {
              lyrics: pollRes.data.lyrics,
              title: pollRes.data.song_title,
              styleTags: pollRes.data.style_tags,
            }
          }

          if (pollRes.data?.status === 3) {
            logger.error('歌词优化失败: 任务失败')
            logger.info('========== 歌词优化结束 ==========')
            return { error: '歌词优化任务失败，请重试' }
          }
        } catch (pollErr) {
          logger.warn(`轮询请求失败: ${pollErr}`)
        }
      }

      logger.error('歌词优化超时')
      logger.info('========== 歌词优化结束 ==========')
      return { error: '歌词优化超时，请重试' }
    }

    logger.warn('歌词优化响应异常:', JSON.stringify(res))
    logger.info('========== 歌词优化结束 ==========')
    return { error: '歌词优化状态异常，请重试' }
  } catch (err) {
    logger.error('歌词优化失败:', err)
    logger.info('========== 歌词优化结束 ==========')
    if (err instanceof Error) {
      return { error: `歌词优化失败: ${err.message}` }
    }
    return { error: '歌词优化失败，请稍后重试' }
  }
}

/**
 * 清洗和格式化歌词 - 只处理换行符转换
 */
function cleanLyrics(lyrics: string): string {
  if (!lyrics) return ''
  // 只转换转义的换行符，不添加任何结构标签
  return lyrics.replace(/\\n/g, '\n').trim()
}

async function cleanupCache(cacheDir: string, hours: number): Promise<void> {
  try {
    const exists = await fs.promises.access(cacheDir).then(() => true).catch(() => false)
    if (!exists) return

    const now = Date.now()
    const maxAge = hours * 60 * 60 * 1000
    const files = await fs.promises.readdir(cacheDir)
    for (const file of files) {
      if (!file.startsWith('music_')) continue
      const filepath = path.join(cacheDir, file)
      try {
        const stat = await fs.promises.stat(filepath)
        if (now - stat.mtimeMs > maxAge) {
          await fs.promises.unlink(filepath)
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

interface GenerateMusicPayload {
  model: string
  prompt?: string
  lyrics?: string
  stream: boolean
  output_format: string
  audio_setting: {
    sample_rate: number
    bitrate: number
    format: string
  }
  aigc_watermark?: boolean
  lyrics_optimizer?: boolean
  is_instrumental?: boolean
}

interface GenerateMusicResponse {
  data?: {
    status: number
    audio?: string
  }
  base_resp?: {
    status_code: number
    status_msg: string
  }
  trace_id?: string
}

export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger('minimax-music')

  // 存储每个用户的多轮对话状态
  const userContexts = new Map<string, MusicContext>()

  ctx.on('ready', async () => {
    try {
      await fs.promises.mkdir(config.cacheDir, { recursive: true })
      logger.info(`缓存目录已准备: ${config.cacheDir}`)
    } catch (err) {
      logger.error(`创建缓存目录失败: ${err}`)
    }
  })

  ctx.setInterval(() => {
    cleanupCache(config.cacheDir, config.cleanupHours)
  }, 60 * 60 * 1000)

  /**
   * 发送思考消息 - 立即返回撤回函数，后台延迟发送
   */
  function sendThinkingMessage(session: Session): () => Promise<void> {
    const messageIds: string[] = []
    let sent = false

    // 延迟后发送思考消息
    if (config.thinkingMessageEnabled) {
      setTimeout(async () => {
        if (sent) return
        try {
          const ids = await session.send('🎵 正在生成音乐，请稍候...（这可能需要一分钟或更久）')
          messageIds.push(...(Array.isArray(ids) ? ids : [ids]))
          logger.info('已发送思考消息，messageIds:', messageIds)

          // 3分钟后自动撤回
          setTimeout(async () => {
            for (const mid of messageIds) {
              try {
                await session.bot.deleteMessage(session.channelId, mid)
              } catch {
                // ignore
              }
            }
          }, 3 * 60 * 1000)
        } catch (err) {
          logger.error('发送思考消息失败:', err)
        }
      }, config.thinkingMessageDelay * 1000)
    }

    // 立即返回撤回函数
    return async () => {
      sent = true
      for (const mid of messageIds) {
        try {
          await session.bot.deleteMessage(session.channelId, mid)
        } catch {
          // ignore
        }
      }
    }
  }

  /**
   * 生成音乐核心逻辑
   * 直接返回 h.audio() 元素，使用 data: URL 协议
   */
  async function generateMusic(
    session: Session,
    prompt: string,
    options: {
      lyrics?: string
      isInstrumental?: boolean
      lyricsOptimizer?: boolean
    }
  ): Promise<Element | { error: string }> {
    const startTime = Date.now()
    const { lyrics, isInstrumental = false, lyricsOptimizer = false } = options

    logger.info(`开始生成音乐，prompt: ${prompt.substring(0, 50)}...`)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    }

    const payload: GenerateMusicPayload = {
      model: config.model,
      prompt: prompt,
      stream: false,
      output_format: config.outputFormat,
      audio_setting: {
        sample_rate: config.sampleRate,
        bitrate: config.bitrate,
        format: config.audioFormat,
      },
    }

    if (isInstrumental) {
      if (!config.model.includes('2.5+')) {
        return { error: '纯音乐模式仅支持 music-2.5+ 模型' }
      }
      payload.is_instrumental = true
    } else {
      let processedLyrics = lyrics
      if (processedLyrics) {
        processedLyrics = cleanLyrics(processedLyrics)
        payload.lyrics = processedLyrics
      } else if (lyricsOptimizer || config.lyricsOptimizer) {
        payload.lyrics_optimizer = true
      }
    }

    if (config.aigcWatermark) {
      payload.aigc_watermark = true
    }

    let recallFunc: (() => Promise<void>) | null = null

    try {
      // 启动思考消息（异步发送，不阻塞）
      recallFunc = sendThinkingMessage(session)
      logger.info('已启动思考消息定时器')

      const res = await ctx.http.post<GenerateMusicResponse>(MUSIC_API_ENDPOINT, payload, {
        headers,
        timeout: config.requestTimeout * 1000,
      })

      logger.info('API 请求完成，撤回思考消息')
      if (recallFunc) await recallFunc()

      if (!res.base_resp || res.base_resp.status_code !== 0) {
        const code = res.base_resp?.status_code || -1
        const msg = res.base_resp?.status_msg || '未知错误'
        logger.error(`API 错误 [${code}]: ${msg}`)
        return { error: handleError(code, msg) }
      }

      if (!res.data || res.data.status !== 2) {
        return { error: '音乐生成状态异常，请重试' }
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000)
      logger.info(`音乐生成完成，耗时: ${elapsed}秒`)

      if (config.outputFormat === 'hex') {
        if (!res.data.audio) {
          return { error: '未收到音频数据，请重试' }
        }

        await fs.promises.mkdir(config.cacheDir, { recursive: true })
        const buffer = Buffer.from(res.data.audio, 'hex')
        const ext = getExtension(config.audioFormat)
        const filename = `music_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
        const filepath = path.join(config.cacheDir, filename)

        await fs.promises.writeFile(filepath, buffer)
        logger.info(`音频已保存: ${filepath} (${buffer.length} bytes)`)

        // 直接使用 h.audio() 和 Buffer 发送音频（兼容 QQ RED 等适配器）
        // 注意：mp3 使用 audio/mp3 而非 audio/mpeg，以确保文件名为 xxx.mp3 而非 xxx.mpga
        const mimeType = ext === 'mp3' ? 'audio/mp3' : ext === 'wav' ? 'audio/wav' : 'audio/x-wav'
        logger.info(`构建 audio 元素，Buffer 大小: ${buffer.length} bytes`)

        // 如果配置为文件形式发送，使用 h.file() 发送文件附件
        if (config.sendAsFile) {
          // 使用 data URL 方式发送
          logger.info(`以文件形式发送，Buffer 大小: ${buffer.length} bytes`)
          return h.file(buffer, mimeType)
        }

        // 尝试转换为 silk 格式（QQ RED 需要）
        const silkBuffer = await convertToSilk(buffer, mimeType, logger)
        if (silkBuffer) {
          logger.info(`使用 silk 格式发送，Buffer 大小: ${silkBuffer.length} bytes`)
          return h.audio(silkBuffer, 'audio/silk')
        }

        // 返回 h.audio() 元素
        return h.audio(buffer, mimeType)
      } else {
        // URL 模式直接使用返回的 URL
        const audioUrl = res.data.audio
        if (!audioUrl) {
          return { error: '未收到音频数据，请重试' }
        }
        logger.info(`使用返回的 URL: ${audioUrl.substring(0, 50)}...`)
        return h.audio(audioUrl)
      }
    } catch (err) {
      if (recallFunc) await recallFunc()

      const elapsed = Math.round((Date.now() - startTime) / 1000)
      logger.error(`生成失败 [${elapsed}s]:`, err)

      if (err instanceof Error) {
        if (err.message.includes('UND_ERR_HEADERS_TIMEOUT') ||
            err.message.includes('timeout') ||
            err.message.includes('Timeout')) {
          return { error: `请求超时（${elapsed}秒），MiniMax 服务器响应过慢，请稍后重试` }
        }
        if (err.message.includes('ECONNREFUSED')) {
          return { error: '无法连接到 MiniMax API，请检查网络' }
        }
        if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
          return { error: '无法解析 API 地址，请检查网络' }
        }
        return { error: `生成失败: ${err.message}` }
      }
      return { error: '生成失败，请稍后重试' }
    }
  }

  /**
   * 获取用户上下文（带清理）
   */
  function getUserContext(userId: string): MusicContext | undefined {
    return userContexts.get(userId)
  }

  function setUserContext(userId: string, context: MusicContext): void {
    userContexts.set(userId, context)
  }

  function clearUserContext(userId: string): void {
    userContexts.delete(userId)
  }

  /**
   * 撤回所有向导消息
   */
  async function recallWizardMessages(session: Session, context: MusicContext): Promise<void> {
    if (context.wizardMessageIds && context.wizardMessageIds.length > 0) {
      for (const mid of context.wizardMessageIds) {
        try {
          await session.bot.deleteMessage(session.channelId, mid)
        } catch {
          // ignore
        }
      }
      logger.info(`已撤回 ${context.wizardMessageIds.length} 条向导消息`)
    }
  }

  // 帮助文本
  const helpText = `
🎵 **MiniMax 音乐生成插件使用说明**

**命令格式:**
\`/music <风格描述>\`

**示例:**
- \`/music 流行音乐,欢快,阳光\`
- \`/music 抒情摇滚\`

**使用方法:**
1. 输入 \`/music\` 加风格描述
2. 选择生成纯音乐还是带歌词歌曲
3. 根据选择完成生成

**其他命令:**
- \`/music help\` - 显示帮助
`.trim()

  /**
   * 处理音乐生成向导
   */
  async function handleMusicWizard(session: Session, prompt: string): Promise<void> {
    const userId = session.userId

    // 初始化上下文
    const context: MusicContext = {
      prompt: prompt.trim(),
      awaitingChoice: 'type',
      wizardMessageIds: [],
    }
    setUserContext(userId, context)

    // 询问类型选择，并保存消息ID用于后续撤回
    const ids = await session.send(
      `🎵 **音乐生成向导**\n\n` +
      `风格: ${prompt.trim()}\n\n` +
      `请选择生成类型:\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `1️⃣ 输入 **Y** 或 **是** → 生成纯音乐（无人声）\n` +
      `2️⃣ 输入 **N** 或 **否** → 生成带歌词歌曲\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `输入 "取消" 可终止操作`
    )
    context.wizardMessageIds?.push(...(Array.isArray(ids) ? ids : [ids]))
  }

  /**
   * 处理用户回复
   */
  async function handleUserReply(session: Session, text: string): Promise<CommandResult> {
    const userId = session.userId
    const context = getUserContext(userId)

    if (!context) {
      return // 没有进行中的向导，忽略
    }

    // 保存用户消息ID，用于后续撤回
    const userMsgId = (session as any).messageId || (session as any).msgId
    if (userMsgId) {
      context.wizardMessageIds = context.wizardMessageIds || []
      context.wizardMessageIds.push(userMsgId)
    }

    const input = text.trim().toLowerCase()

    // 处理取消
    if (input === '取消' || input === 'cancel' || input === 'quit') {
      clearUserContext(userId)
      return '❌ 已取消音乐生成'
    }

    // 处理帮助
    if (input === 'help' || input === '帮助') {
      return h('markdown', { content: helpText })
    }

    switch (context.awaitingChoice) {
      case 'type':
        return handleTypeChoice(session, input)
      case 'lyrics':
        return handleLyricsChoice(session, input, text)
      default:
        clearUserContext(userId)
        return '❌ 操作超时，请重新开始'
    }
  }

  /**
   * 处理类型选择
   */
  async function handleTypeChoice(session: Session, input: string): Promise<CommandResult> {
    const userId = session.userId
    const context = getUserContext(userId)
    if (!context) return

    // 纯音乐
    if (input === 'y' || input === '是' || input === 'yes' || input === '1') {
      context.isInstrumental = true

      const result = await generateMusic(session, context.prompt, {
        isInstrumental: true,
      })

      // 撤回所有向导消息
      await recallWizardMessages(session, context)
      clearUserContext(userId)

      // 检查是否为错误对象
      if ('error' in result) {
        return `❌ ${result.error}`
      }

      // 返回音频元素
      return result
    }

    // 带歌词歌曲
    if (input === 'n' || input === '否' || input === 'no' || input === '2') {
      // 如果配置了自动歌词生成，直接生成
      if (config.lyricsOptimizer) {
        context.lyricsOptimizer = true

        const result = await generateMusic(session, context.prompt, {
          lyricsOptimizer: true,
          isInstrumental: false,
        })

        // 撤回所有向导消息
        await recallWizardMessages(session, context)
        clearUserContext(userId)

        // 检查是否为错误对象
        if ('error' in result) {
          return `❌ ${result.error}`
        }

        // 返回音频元素
        return result
      }

      // 否则询问歌词设置
      context.awaitingChoice = 'lyrics'

      const ids = await session.send(
        `🎤 **歌词设置**\n\n` +
        `请选择歌词方式:\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `1️⃣ 输入 **歌词内容** → 使用自定义歌词\n` +
        `2️⃣ 输入 **N** 或 **否** → 自动根据风格生成歌词\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `输入 "取消" 可终止操作`
      )
      context.wizardMessageIds?.push(...(Array.isArray(ids) ? ids : [ids]))

      return
    }

    // 无效输入
    return (
      `❓ 无效的选择，请重新输入:\n\n` +
      `1️⃣ 输入 **Y** 或 **是** → 生成纯音乐\n` +
      `2️⃣ 输入 **N** 或 **否** → 生成带歌词歌曲`
    )
  }

  /**
   * 处理歌词选择
   */
  async function handleLyricsChoice(session: Session, input: string, fullText: string): Promise<CommandResult> {
    const userId = session.userId
    const context = getUserContext(userId)
    if (!context) return

    // 自动生成歌词
    if (input === 'n' || input === '否' || input === 'no') {
      context.lyricsOptimizer = true

      const result = await generateMusic(session, context.prompt, {
        lyricsOptimizer: true,
        isInstrumental: false,
      })

      // 撤回所有向导消息
      await recallWizardMessages(session, context)
      clearUserContext(userId)

      // 检查是否为错误对象
      if ('error' in result) {
        return `❌ ${result.error}`
      }

      // 返回音频元素
      return result
    }

    // 用户输入歌词
    let finalLyrics = fullText.trim()

    // 如果开启了自动优化歌词，先调用API优化格式
    if (config.autoOptimizeLyrics) {
      const recallFunc = sendThinkingMessage(session)

      const optimizeMsg = await session.send('✨ 正在使用AI优化歌词格式...')
      context.wizardMessageIds?.push(...(Array.isArray(optimizeMsg) ? optimizeMsg : [optimizeMsg]))

      const optimized = await optimizeLyrics(ctx, config, context.prompt, finalLyrics, logger)

      if (recallFunc) await recallFunc()

      if (optimized.error) {
        // 优化失败时，使用原始歌词继续
        const errMsg = await session.send(`⚠️ 歌词优化失败，将使用原始歌词: ${optimized.error}`)
        context.wizardMessageIds?.push(...(Array.isArray(errMsg) ? errMsg : [errMsg]))
      } else if (optimized.lyrics) {
        finalLyrics = optimized.lyrics
        context.generatedTitle = optimized.title
        context.generatedStyleTags = optimized.styleTags
        context.generatedLyrics = optimized.lyrics

        // 显示优化结果
        let response = '✨ 歌词格式优化完成!\n\n'
        if (optimized.title) {
          response += `**歌名**: ${optimized.title}\n`
        }
        if (optimized.styleTags) {
          response += `**风格标签**: ${optimized.styleTags}\n`
        }
        response += `**歌词预览**:\n\`\`\`\n${optimized.lyrics.substring(0, 200)}${optimized.lyrics.length > 200 ? '...' : ''}\n\`\`\`\n\n正在生成音乐...`

        const responseMsg = await session.send(response)
        context.wizardMessageIds?.push(...(Array.isArray(responseMsg) ? responseMsg : [responseMsg]))
      }
    }

    context.lyrics = finalLyrics
    context.awaitingChoice = undefined

    const result = await generateMusic(session, context.prompt, {
      lyrics: context.lyrics,
      isInstrumental: false,
    })

    // 撤回所有向导消息
    await recallWizardMessages(session, context)
    clearUserContext(userId)

    // 检查是否为错误对象
    if ('error' in result) {
      return `❌ ${result.error}`
    }

    // 返回音频元素
    return result
  }

  // 主命令: /music
  ctx.command('music [prompt:text]', 'MiniMax 音乐生成')
    .example('/music 流行音乐,欢快,阳光')
    .action(async (argv, prompt) => {
      const session = argv.session

      // 显示帮助
      if (!prompt || prompt.toLowerCase() === 'help' || prompt.toLowerCase() === '帮助') {
        return h('markdown', { content: helpText })
      }

      if (!prompt?.trim()) {
        return '❌ 请提供音乐风格描述\n\n例如: /music 流行音乐,欢快,阳光\n\n输入 "/music help" 查看更多用法'
      }

      await handleMusicWizard(session, prompt)
    })

  // 监听用户消息，处理多轮对话
  ctx.middleware(async (session, next) => {
    const userId = session.userId
    const context = getUserContext(userId)

    // 如果没有进行中的向导，继续正常流程
    if (!context) {
      return next()
    }

    // 获取消息文本 - session.content 才是获取用户消息的正确方式
    const textContent = (session.content || '').trim()

    // 如果是命令，不处理
    if (textContent.startsWith('/')) {
      clearUserContext(userId)
      return next()
    }

    // 处理多轮对话回复
    const result = await handleUserReply(session, textContent)

    if (result === undefined) {
      return
    }

    return result
  }, true)

  // 取消命令
  ctx.command('music.cancel', '取消当前音乐生成')
    .action((argv) => {
      const userId = argv.session.userId
      if (userContexts.has(userId)) {
        userContexts.delete(userId)
        return '❌ 已取消当前音乐生成'
      }
      return '❌ 没有正在进行的音乐生成'
    })

  logger.info('MiniMax Music 插件已加载')
}
