# koishi-plugin-minimax-music

MiniMax 音乐生成插件 for Koishi 4

## 功能特性

- 调用 MiniMax API 生成音乐
- 支持纯音乐和带歌词歌曲生成
- 支持歌词自动优化（AI 格式优化）
- 多轮对话交互向导
- 本地文件缓存
- 思考消息提示

## 安装

```bash
npm install koishi-plugin-minimax-music
```

或从 Koishi 插件市场安装。

## 配置

```yaml
plugins:
  minimax-music:
    apiKey: your-minimax-api-key
    model: music-2.5+  # 可选: music-2.5, music-2.5+
    outputFormat: hex    # 可选: hex, url
    sampleRate: 44100
    bitrate: 256000
    audioFormat: mp3     # 可选: mp3, wav, pcm
    autoOptimizeLyrics: false  # 是否开启自动AI优化歌词
```

## 使用方法

1. 发送 `/music <风格描述>` 开始生成
2. 选择生成纯音乐或带歌词歌曲
3. 根据选择完成生成

### 示例

```
/music 流行音乐,欢快,阳光
/music 抒情摇滚风格
```

## API

需要 MiniMax API Key，请前往 [MiniMax 开放平台](https://platform.minimaxi.com/) 申请。

## 更新日志

### v1.0.1
- 修复音频发送问题：改用 `h.audio(Buffer, mimeType)` 方式直接发送音频，兼容 QQ RED 等适配器
- 移除 `assets.upload()` 调用，简化音频发送逻辑

### v1.0.0
- 初始版本
- 支持纯音乐和带歌词歌曲生成
- 多轮对话交互向导
- 自动AI优化歌词功能

## License

MIT
