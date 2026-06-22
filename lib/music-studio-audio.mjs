/**
 * Music Studio Web Audio engine with a shared master bus and effect chain.
 * Voices connect to a summing input; each voice is disconnected after release
 * so delay/reverb feedback loops cannot accumulate across rapid key presses.
 */

/** @typedef {'synth' | 'piano' | 'strings' | 'bass'} InstrumentType */

/** @typedef {{
 *   reverb: { enabled: boolean; roomSize: number; damping: number; wetness: number };
 *   delay: { enabled: boolean; time: number; feedback: number; wetness: number };
 *   chorus: { enabled: boolean; rate: number; depth: number; wetness: number };
 *   distortion: { enabled: boolean; amount: number; wetness: number };
 *   filter: { enabled: boolean; frequency: number; Q: number; type: BiquadFilterType };
 * }} EffectSettings */

/** @typedef {{
 *   oscillator: OscillatorNode;
 *   gain: GainNode;
 *   cleanupTimer: ReturnType<typeof setTimeout> | null;
 * }} ActiveVoice */

export const NOTE_FREQUENCIES = /** @type {Record<string, number>} */ ({
  C3: 130.81, 'C#3': 138.59, Db3: 138.59, D3: 146.83, 'D#3': 155.56, Eb3: 155.56,
  E3: 164.81, F3: 174.61, 'F#3': 185.0, Gb3: 185.0, G3: 196.0, 'G#3': 207.65,
  Ab3: 207.65, A3: 220.0, 'A#3': 233.08, Bb3: 233.08, B3: 246.94,
  C4: 261.63, 'C#4': 277.18, Db4: 277.18, D4: 293.66, 'D#4': 311.13, Eb4: 311.13,
  E4: 329.63, F4: 349.23, 'F#4': 369.99, Gb4: 369.99, G4: 392.0, 'G#4': 415.3,
  Ab4: 415.3, A4: 440.0, 'A#4': 466.16, Bb4: 466.16, B4: 493.88,
  C5: 523.25, 'C#5': 554.37, Db5: 554.37, D5: 587.33, 'D#5': 622.25, Eb5: 622.25,
  E5: 659.25, F5: 698.46, 'F#5': 739.99, Gb5: 739.99, G5: 783.99, 'G#5': 830.61,
  Ab5: 830.61, A5: 880.0, 'A#5': 932.33, Bb5: 932.33, B5: 987.77
});

export const DEFAULT_EFFECTS = /** @type {EffectSettings} */ ({
  reverb: { enabled: true, roomSize: 0.3, damping: 0.5, wetness: 0.3 },
  delay: { enabled: true, time: 0.3, feedback: 0.3, wetness: 0.3 },
  chorus: { enabled: true, rate: 1.5, depth: 0.3, wetness: 0.5 },
  distortion: { enabled: true, amount: 25, wetness: 0.5 },
  filter: { enabled: true, frequency: 1000, Q: 8, type: 'lowpass' }
});

export const MAX_POLYPHONY = 12;
export const MIN_NOTE_INTERVAL_MS = 45;

/**
 * @param {number} amount
 * @returns {Float32Array<ArrayBuffer>}
 */
export function makeDistortionCurve(amount) {
  const k = typeof amount === 'number' ? amount : 50;
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2 / samples) - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }

  return curve;
}

/**
 * @param {Float32Array | Uint8Array} magnitudeData
 * @param {number} sampleRate
 * @param {number} fftSize
 * @param {number} [minHz]
 * @returns {number}
 */
export function estimateDominantFrequency(magnitudeData, sampleRate, fftSize, minHz = 60) {
  const minIndex = Math.max(1, Math.floor((minHz * fftSize) / sampleRate));
  let maxIndex = minIndex;
  let maxValue = 0;

  for (let i = minIndex; i < magnitudeData.length; i += 1) {
    const value = magnitudeData[i] ?? 0;
    if (value > maxValue) {
      maxValue = value;
      maxIndex = i;
    }
  }

  return (maxIndex * sampleRate) / fftSize;
}

/**
 * @param {InstrumentType | string} instrument
 * @returns {number}
 */
export function getNoteDurationMs(instrument) {
  switch (instrument) {
    case 'piano': return 2000;
    case 'strings': return 3000;
    case 'bass': return 1000;
    case 'synth':
    default: return 800;
  }
}

/**
 * @param {GainNode} gainNode
 * @param {InstrumentType | string} instrument
 * @param {number} now
 */
export function applyVoiceEnvelope(gainNode, instrument, now) {
  switch (instrument) {
    case 'piano':
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.exponentialRampToValueAtTime(1, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2);
      break;
    case 'strings':
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.exponentialRampToValueAtTime(0.8, now + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.6, now + 1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 3);
      break;
    case 'bass':
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.exponentialRampToValueAtTime(0.9, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);
      break;
    case 'synth':
    default:
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.exponentialRampToValueAtTime(0.8, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      break;
  }
}

/**
 * @param {AudioContext} context
 * @param {number} frequency
 * @param {InstrumentType | string} instrument
 * @returns {OscillatorNode}
 */
export function createInstrumentOscillator(context, frequency, instrument) {
  const oscillator = context.createOscillator();
  oscillator.frequency.value = frequency;

  switch (instrument) {
    case 'piano':
      oscillator.type = 'triangle';
      break;
    case 'strings':
      oscillator.type = 'sawtooth';
      break;
    case 'bass':
      oscillator.type = 'square';
      break;
    case 'synth':
    default:
      oscillator.type = 'sawtooth';
      break;
  }

  return oscillator;
}

/**
 * @param {AudioContext} context
 * @param {EffectSettings} effects
 * @returns {{ nodes: AudioNode[]; chorusLFO: OscillatorNode | null; output: AudioNode }}
 */
export function buildSharedEffectChain(context, effects) {
  /** @type {AudioNode[]} */
  const nodes = [];
  let output = context.createGain();
  nodes.push(output);
  let chorusLFO = null;

  if (effects.filter.enabled) {
    const filter = context.createBiquadFilter();
    filter.type = effects.filter.type;
    filter.frequency.value = effects.filter.frequency;
    filter.Q.value = effects.filter.Q;
    output.connect(filter);
    output = filter;
    nodes.push(filter);
  }

  if (effects.distortion.enabled) {
    const distortion = context.createWaveShaper();
    distortion.curve = makeDistortionCurve(effects.distortion.amount);
    distortion.oversample = '4x';

    const dryGain = context.createGain();
    const wetGain = context.createGain();
    const mixGain = context.createGain();
    dryGain.gain.value = 1 - effects.distortion.wetness;
    wetGain.gain.value = effects.distortion.wetness;

    output.connect(dryGain);
    output.connect(distortion);
    distortion.connect(wetGain);
    dryGain.connect(mixGain);
    wetGain.connect(mixGain);
    output = mixGain;
    nodes.push(distortion, dryGain, wetGain, mixGain);
  }

  if (effects.delay.enabled) {
    const delayNode = context.createDelay(1);
    const delayGain = context.createGain();
    const feedbackGain = context.createGain();
    const wetGain = context.createGain();
    const dryGain = context.createGain();
    const mixGain = context.createGain();

    delayNode.delayTime.value = Math.min(effects.delay.time, 0.8);
    wetGain.gain.value = effects.delay.wetness;
    dryGain.gain.value = 1 - effects.delay.wetness;
    feedbackGain.gain.value = effects.delay.feedback;

    output.connect(dryGain);
    output.connect(delayGain);
    delayGain.connect(delayNode);
    delayNode.connect(wetGain);
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayGain);
    dryGain.connect(mixGain);
    wetGain.connect(mixGain);
    output = mixGain;
    nodes.push(delayNode, delayGain, feedbackGain, wetGain, dryGain, mixGain);
  }

  if (effects.reverb.enabled) {
    const reverbGain = context.createGain();
    const dryGain = context.createGain();
    const mixGain = context.createGain();
    reverbGain.gain.value = effects.reverb.wetness;
    dryGain.gain.value = 1 - effects.reverb.wetness;

    [0.03, 0.05, 0.07, 0.09].forEach((time) => {
      const delay = context.createDelay();
      const gain = context.createGain();
      delay.delayTime.value = time * effects.reverb.roomSize;
      gain.gain.value = 0.3 * (1 - effects.reverb.damping);
      output.connect(delay);
      delay.connect(gain);
      gain.connect(reverbGain);
      nodes.push(delay, gain);
    });

    output.connect(dryGain);
    dryGain.connect(mixGain);
    reverbGain.connect(mixGain);
    output = mixGain;
    nodes.push(reverbGain, dryGain, mixGain);
  }

  if (effects.chorus.enabled) {
    const chorusDelay = context.createDelay(0.05);
    chorusLFO = context.createOscillator();
    const chorusGain = context.createGain();
    const chorusDepth = context.createGain();
    const dryGain = context.createGain();
    const mixGain = context.createGain();

    chorusLFO.frequency.value = effects.chorus.rate;
    chorusLFO.type = 'sine';
    chorusDepth.gain.value = effects.chorus.depth * 0.002;
    chorusDelay.delayTime.value = 0.02;
    chorusGain.gain.value = effects.chorus.wetness;
    dryGain.gain.value = 1 - effects.chorus.wetness;

    chorusLFO.connect(chorusDepth);
    chorusDepth.connect(chorusDelay.delayTime);
    output.connect(chorusDelay);
    chorusDelay.connect(chorusGain);
    output.connect(dryGain);
    dryGain.connect(mixGain);
    chorusGain.connect(mixGain);
    output = mixGain;
    nodes.push(chorusDelay, chorusLFO, chorusGain, chorusDepth, dryGain, mixGain);
  }

  return { nodes, chorusLFO, output };
}

/**
 * @param {{
 *   createContext?: () => AudioContext;
 *   maxPolyphony?: number;
 *   minNoteIntervalMs?: number;
 * }} [options]
 */
export function createMusicStudioAudioEngine(options = {}) {
  const createContext = options.createContext ?? (() => new AudioContext());
  const maxPolyphony = options.maxPolyphony ?? MAX_POLYPHONY;
  const minNoteIntervalMs = options.minNoteIntervalMs ?? MIN_NOTE_INTERVAL_MS;

  /** @type {AudioContext | null} */
  let audioContext = null;
  /** @type {GainNode | null} */
  let voiceBus = null;
  /** @type {GainNode | null} */
  let masterGain = null;
  /** @type {AnalyserNode | null} */
  let monitorAnalyser = null;
  /** @type {AudioNode | null} */
  let effectTail = null;
  /** @type {AudioNode[]} */
  let effectNodes = [];
  /** @type {OscillatorNode | null} */
  let chorusLFO = null;
  /** @type {EffectSettings} */
  let effectSettings = structuredClone(DEFAULT_EFFECTS);
  /** @type {InstrumentType} */
  let instrument = 'synth';
  /** @type {ActiveVoice[]} */
  const activeVoices = [];
  /** @type {Map<string, number>} */
  const lastPlayedAt = new Map();
  let destinationConnections = 0;
  let lastPlayedFrequency = 0;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let effectRebuildTimer = null;
  const EFFECT_REBUILD_DEBOUNCE_MS = 100;

  function requireContext() {
    if (!audioContext) {
      /* istanbul ignore next -- playNote returns early when audioContext is missing */
      throw new Error('Audio context not initialized');
    }
    return audioContext;
  }

  function stopChorusLFO() {
    if (!chorusLFO) {
      return;
    }
    try {
      chorusLFO.stop();
    } catch {
      // LFO may already be stopped.
    }
    try {
      chorusLFO.disconnect();
    } catch {
      // Ignore disconnect errors during teardown.
    }
    chorusLFO = null;
  }

  function teardownEffectChain() {
    stopChorusLFO();
    if (voiceBus && effectTail) {
      try {
        voiceBus.disconnect(effectTail);
      } catch {
        // Chain may already be disconnected.
      }
    }
    effectNodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // Ignore stale nodes.
      }
    });
    effectNodes = [];
    effectTail = null;
  }

  function cancelScheduledEffectRebuild() {
    if (effectRebuildTimer) {
      clearTimeout(effectRebuildTimer);
      effectRebuildTimer = null;
    }
  }

  function scheduleEffectRebuild() {
    cancelScheduledEffectRebuild();
    effectRebuildTimer = setTimeout(() => {
      effectRebuildTimer = null;
      if (activeVoices.length > 0) {
        scheduleEffectRebuild();
        return;
      }
      rebuildEffectChain();
    }, EFFECT_REBUILD_DEBOUNCE_MS);
  }

  function rebuildEffectChain() {
    const context = requireContext();
    if (!voiceBus || !masterGain) {
      /* istanbul ignore next -- init creates bus and gain before the first rebuild */
      return;
    }

    teardownEffectChain();
    const chain = buildSharedEffectChain(context, effectSettings);
    effectNodes = chain.nodes;
    effectTail = chain.output;
    chorusLFO = chain.chorusLFO;
    voiceBus.connect(effectTail);
    effectTail.connect(masterGain);
    if (chorusLFO) {
      chorusLFO.start();
    }
  }

  /**
   * @param {ActiveVoice} voice
   */
  function releaseVoice(voice) {
    if (voice.cleanupTimer) {
      clearTimeout(voice.cleanupTimer);
      voice.cleanupTimer = null;
    }
    try {
      voice.oscillator.stop();
    } catch {
      // Oscillator may already be stopped.
    }
    try {
      voice.oscillator.disconnect();
    } catch {
      // Ignore disconnect errors.
    }
    try {
      voice.gain.disconnect();
    } catch {
      // Ignore disconnect errors.
    }
    const index = activeVoices.indexOf(voice);
    if (index >= 0) {
      activeVoices.splice(index, 1);
    }
  }

  function stealOldestVoice() {
    const oldest = activeVoices.shift();
    if (oldest) {
      releaseVoice(oldest);
    }
  }

  return {
    get audioContext() {
      return audioContext;
    },

    get destinationConnectionCount() {
      return destinationConnections;
    },

    getActiveVoiceCount() {
      return activeVoices.length;
    },

    init() {
      if (audioContext && audioContext.state !== 'closed') {
        return true;
      }

      cancelScheduledEffectRebuild();
      activeVoices.splice(0, activeVoices.length).forEach((voice) => {
        releaseVoice(voice);
      });
      teardownEffectChain();
      masterGain = null;
      monitorAnalyser = null;
      voiceBus = null;
      effectTail = null;
      destinationConnections = 0;
      audioContext = null;
      lastPlayedAt.clear();
      lastPlayedFrequency = 0;

      try {
        audioContext = createContext();
      } catch {
        audioContext = null;
        return false;
      }

      voiceBus = audioContext.createGain();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.3;
      monitorAnalyser = audioContext.createAnalyser();
      monitorAnalyser.fftSize = 4096;
      masterGain.connect(monitorAnalyser);
      monitorAnalyser.connect(audioContext.destination);
      destinationConnections = 1;
      rebuildEffectChain();
      return true;
    },

    dispose() {
      cancelScheduledEffectRebuild();
      activeVoices.splice(0, activeVoices.length).forEach((voice) => {
        releaseVoice(voice);
      });
      teardownEffectChain();
      if (masterGain) {
        try {
          masterGain.disconnect();
        } catch {
          // Ignore disconnect errors.
        }
        masterGain = null;
      }
      if (monitorAnalyser) {
        try {
          monitorAnalyser.disconnect();
        } catch {
          // Ignore disconnect errors.
        }
        monitorAnalyser = null;
      }
      if (voiceBus) {
        try {
          voiceBus.disconnect();
        } catch {
          // Ignore disconnect errors.
        }
        voiceBus = null;
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {
          // Ignore close errors in teardown.
        });
      }
      audioContext = null;
      destinationConnections = 0;
      lastPlayedAt.clear();
      lastPlayedFrequency = 0;
    },

    /** @param {number} volume */
    setMasterVolume(volume) {
      if (masterGain) {
        masterGain.gain.value = volume;
      }
    },

    /** @param {InstrumentType | string} nextInstrument */
    setInstrument(nextInstrument) {
      instrument = /** @type {InstrumentType} */ (nextInstrument);
    },

    /** @param {EffectSettings} effects */
    setEffects(effects) {
      effectSettings = structuredClone(effects);
      if (audioContext) {
        scheduleEffectRebuild();
      }
    },

    /** @returns {EffectSettings} */
    getEffects() {
      return structuredClone(effectSettings);
    },

    getLastPlayedFrequency() {
      return lastPlayedFrequency;
    },

    getAnalyser() {
      return monitorAnalyser;
    },

    /**
     * @returns {number | null}
     */
    readDominantFrequency() {
      if (!monitorAnalyser || !audioContext) {
        return null;
      }
      const bins = new Uint8Array(monitorAnalyser.frequencyBinCount);
      monitorAnalyser.getByteFrequencyData(bins);
      return estimateDominantFrequency(bins, audioContext.sampleRate, monitorAnalyser.fftSize);
    },

    /**
     * @param {string} noteName
     * @returns {boolean}
     */
    playNote(noteName) {
      if (!audioContext || !voiceBus) {
        return false;
      }

      if (audioContext.state === 'closed') {
        return false;
      }

      if (audioContext.state === 'suspended') {
        return false;
      }

      if (!effectTail) {
        rebuildEffectChain();
        if (!effectTail) {
          return false;
        }
      }

      const frequency = NOTE_FREQUENCIES[noteName];
      if (!frequency) {
        return false;
      }

      lastPlayedFrequency = frequency;

      const nowMs = Date.now();
      const lastPlayed = lastPlayedAt.get(noteName) ?? 0;
      if (nowMs - lastPlayed < minNoteIntervalMs) {
        return false;
      }
      lastPlayedAt.set(noteName, nowMs);

      while (activeVoices.length >= maxPolyphony) {
        stealOldestVoice();
      }

      const context = requireContext();
      const oscillator = createInstrumentOscillator(context, frequency, instrument);
      const voiceGain = context.createGain();
      const noteStart = context.currentTime;
      applyVoiceEnvelope(voiceGain, instrument, noteStart);
      oscillator.connect(voiceGain);
      voiceGain.connect(voiceBus);
      oscillator.start(noteStart);

      /** @type {ActiveVoice} */
      const voice = {
        oscillator,
        gain: voiceGain,
        cleanupTimer: null
      };
      activeVoices.push(voice);

      const cleanupDelayMs = getNoteDurationMs(instrument) + 120;
      voice.cleanupTimer = setTimeout(() => {
        releaseVoice(voice);
      }, cleanupDelayMs);

      return true;
    }
  };
}
