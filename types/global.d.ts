import type * as GameUtilsModule from '../lib/game-utils.mjs';
import type * as TypingStatsModule from '../lib/typing-stats.mjs';
import type * as MemoryGameUtilsModule from '../lib/memory-game-utils.mjs';
import type * as ContactValidationModule from '../lib/contact-validation.mjs';

export {};

declare global {
  interface Window {
    GameUtils: typeof GameUtilsModule;
    TypingStats: typeof TypingStatsModule;
    MemoryGameUtils: typeof MemoryGameUtilsModule;
    ContactValidation: typeof ContactValidationModule;
    cleanupMusicStudio?: () => void;
    arrowGameAudioContext?: AudioContext;
    webkitAudioContext?: typeof AudioContext;
    snakeGameActive?: boolean;
    snakeGameInterval?: ReturnType<typeof setInterval> | null;
    typingGameActive?: boolean;
    typingTimerInterval?: ReturnType<typeof setInterval> | null;
    memoryGameActive?: boolean;
    memoryGameTimer?: ReturnType<typeof setInterval> | null;
  }
}
