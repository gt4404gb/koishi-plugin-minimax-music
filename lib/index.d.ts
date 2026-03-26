import { Context, Schema } from 'koishi';
export declare const name = "minimax-music";
export interface Config {
    apiKey: string;
    model: 'music-2.5+' | 'music-2.5';
    outputFormat: 'url' | 'hex';
    sampleRate: 16000 | 24000 | 32000 | 44100;
    bitrate: 32000 | 64000 | 128000 | 256000;
    audioFormat: 'mp3' | 'wav' | 'pcm';
    aigcWatermark: boolean;
    lyricsOptimizer: boolean;
    cacheDir: string;
    cleanupHours: number;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
