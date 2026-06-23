import type * as GameUtilsModule from '../lib/game-utils.mjs';
import type * as TypingStatsModule from '../lib/typing-stats.mjs';
import type * as MemoryGameUtilsModule from '../lib/memory-game-utils.mjs';
import type * as ContactValidationModule from '../lib/contact-validation.mjs';
import type * as SnakeLogicModule from '../lib/snake-logic.mjs';
import type * as MusicStudioAudioModule from '../lib/music-studio-audio.mjs';

export {};

declare global {
  interface Window {
    GameUtils: typeof GameUtilsModule;
    TypingStats: typeof TypingStatsModule;
    MemoryGameUtils: typeof MemoryGameUtilsModule;
    ContactValidation: typeof ContactValidationModule;
    SnakeLogic: typeof SnakeLogicModule;
    MusicStudioAudio: typeof MusicStudioAudioModule;
    loadGamesBundle?: () => Promise<void>;
    cleanupMusicStudio?: () => void;
    googleTranslateInitialized?: boolean;
    googleTranslateElementInit?: () => void;
    googleTranslateMutationObserver?: MutationObserver | null;
    getMusicStudioActiveVoiceCount?: () => number;
    getMusicStudioLastFrequency?: () => number;
    getMusicStudioDestinationConnections?: () => number;
    getMusicStudioEffects?: () => MusicStudioAudioModule.EffectSettings;
    getMusicStudioSpectralEnergy?: () => number;
    cleanupTypingGame?: () => void;
    cleanupMemoryGame?: () => void;
    cleanupSnakeGame?: () => void;
    musicStudioKeyboardHandler?: ((event: KeyboardEvent) => void) | null;
    snakeKeyboardHandler: ((event: KeyboardEvent) => void) | null;
    musicStudioAudioContext?: AudioContext | null;
    musicStudioAnalyser?: AnalyserNode | null;
    layerLoopTimeouts?: Map<number, ReturnType<typeof setTimeout>[]>;
    webkitAudioContext?: typeof AudioContext;
    snakeGameActive?: boolean;
    snakeGameInterval?: ReturnType<typeof setInterval> | null;
    typingGameActive?: boolean;
    typingTimerInterval?: ReturnType<typeof setInterval> | null;
    memoryGameActive?: boolean;
    memoryGameTimer?: ReturnType<typeof setInterval> | null;
    tempoFeedbackInterval?: ReturnType<typeof setInterval> | null;
    layerIntervals?: Map<number, ReturnType<typeof setInterval>>;
  }

  const google: {
    translate: {
      TranslateElement: {
        new (options: Record<string, unknown>, elementId: string): void;
        InlineLayout: Record<string, number>;
      };
    };
  };
}
