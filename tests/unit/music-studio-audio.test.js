import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  NOTE_FREQUENCIES,
  DEFAULT_EFFECTS,
  MAX_POLYPHONY,
  makeDistortionCurve,
  estimateDominantFrequency,
  getNoteDurationMs,
  applyVoiceEnvelope,
  buildSharedEffectChain,
  createMusicStudioAudioEngine
} from '../../lib/music-studio-audio.mjs';

describe('MusicStudioAudio.makeDistortionCurve', () => {
  it('returns a curve with expected length and bounded values', () => {
    const curve = makeDistortionCurve(40);
    expect(curve).toHaveLength(44100);
    expect(curve[0]).toBeLessThan(0);
    expect(curve[curve.length - 1]).toBeGreaterThan(0);
  });
});

describe('MusicStudioAudio.estimateDominantFrequency', () => {
  it('detects the strongest bin for a synthetic peak', () => {
    const fftSize = 2048;
    const sampleRate = 44100;
    const targetHz = 261.63;
    const targetBin = Math.round((targetHz * fftSize) / sampleRate);
    const bins = new Uint8Array(fftSize / 2);
    bins[targetBin] = 255;

    const estimate = estimateDominantFrequency(bins, sampleRate, fftSize);
    expect(Math.abs(estimate - targetHz)).toBeLessThan(30);
  });
});

describe('MusicStudioAudio.getNoteDurationMs', () => {
  it('returns instrument-specific durations', () => {
    expect(getNoteDurationMs('synth')).toBe(800);
    expect(getNoteDurationMs('piano')).toBe(2000);
    expect(getNoteDurationMs('strings')).toBe(3000);
    expect(getNoteDurationMs('bass')).toBe(1000);
    expect(getNoteDurationMs('unknown')).toBe(800);
  });
});

describe('MusicStudioAudio.applyVoiceEnvelope', () => {
  it('schedules gain ramps for each instrument type', () => {
    const calls = [];
    const gainNode = {
      gain: {
        setValueAtTime(value, time) {
          calls.push(['set', value, time]);
        },
        exponentialRampToValueAtTime(value, time) {
          calls.push(['exp', value, time]);
        }
      }
    };

    applyVoiceEnvelope(/** @type {GainNode} */ (gainNode), 'piano', 1);
    applyVoiceEnvelope(/** @type {GainNode} */ (gainNode), 'strings', 2);
    applyVoiceEnvelope(/** @type {GainNode} */ (gainNode), 'bass', 3);
    applyVoiceEnvelope(/** @type {GainNode} */ (gainNode), 'synth', 4);
    expect(calls.length).toBeGreaterThan(8);
  });
});

describe('MusicStudioAudio.buildSharedEffectChain', () => {
  it('creates a single output node for the full enabled chain', () => {
    const connections = [];
    const context = {
      currentTime: 0,
      createGain() {
        return {
          gain: { value: 0 },
          connect(node) {
            connections.push(['gain', node]);
            return node;
          }
        };
      },
      createBiquadFilter() {
        return {
          type: 'lowpass',
          frequency: { value: 0 },
          Q: { value: 0 },
          connect(node) {
            connections.push(['filter', node]);
            return node;
          }
        };
      },
      createWaveShaper() {
        return {
          curve: null,
          oversample: '4x',
          connect(node) {
            connections.push(['shaper', node]);
            return node;
          }
        };
      },
      createDelay() {
        return {
          delayTime: { value: 0 },
          connect(node) {
            connections.push(['delay', node]);
            return node;
          }
        };
      },
      createOscillator() {
        return {
          frequency: { value: 0 },
          type: 'sine',
          connect(node) {
            connections.push(['osc', node]);
            return node;
          },
          start() {},
          stop() {}
        };
      }
    };

    const chain = buildSharedEffectChain(/** @type {AudioContext} */ (context), DEFAULT_EFFECTS);
    expect(chain.output).toBeTruthy();
    expect(chain.nodes.length).toBeGreaterThan(5);
    expect(chain.chorusLFO).toBeTruthy();
  });

  it('omits disabled effects from the chain', () => {
    const context = createMockAudioContext();
    const effects = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    effects.filter.enabled = false;
    effects.distortion.enabled = false;
    effects.delay.enabled = false;
    effects.reverb.enabled = false;
    effects.chorus.enabled = false;
    const chain = buildSharedEffectChain(/** @type {AudioContext} */ (context), effects);
    expect(chain.output).toBeTruthy();
    expect(chain.chorusLFO).toBeNull();
  });
});

describe('MusicStudioAudio.createMusicStudioAudioEngine', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('connects exactly one path to the audio destination', () => {
    let destinationConnections = 0;
    const context = createMockAudioContext(() => {
      destinationConnections += 1;
    });

    const engine = createMusicStudioAudioEngine({
      createContext: () => context,
      maxPolyphony: MAX_POLYPHONY,
      minNoteIntervalMs: 0
    });

    expect(engine.init()).toBe(true);
    expect(engine.destinationConnectionCount).toBe(1);
    expect(destinationConnections).toBe(1);

    engine.playNote('C4');
    engine.playNote('D4');
    engine.playNote('E4');
    expect(engine.getActiveVoiceCount()).toBe(3);
    expect(destinationConnections).toBe(1);

    engine.dispose();
    expect(engine.getActiveVoiceCount()).toBe(0);
  });

  it('caps polyphony and releases voices after their duration', () => {
    vi.useFakeTimers();
    const context = createMockAudioContext();

    const engine = createMusicStudioAudioEngine({
      createContext: () => context,
      maxPolyphony: 3,
      minNoteIntervalMs: 0
    });
    engine.init();

    for (let i = 0; i < 8; i += 1) {
      engine.playNote('C4');
    }

    expect(engine.getActiveVoiceCount()).toBeLessThanOrEqual(3);

    vi.advanceTimersByTime(getNoteDurationMs('synth') + 200);
    expect(engine.getActiveVoiceCount()).toBe(0);
    engine.dispose();
  });

  it('plays expected note frequencies from the note map', () => {
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({
      createContext: () => context,
      minNoteIntervalMs: 0
    });
    engine.init();

    expect(engine.playNote('C4')).toBe(true);
    expect(engine.getLastPlayedFrequency()).toBeCloseTo(NOTE_FREQUENCIES.C4, 2);

    expect(engine.playNote('not-a-note')).toBe(false);
    engine.dispose();
  });

  it('rebuilds the shared effect chain when effects change', () => {
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({ createContext: () => context });
    engine.init();

    const initialNodeCount = context.createdNodes.length;
    const nextEffects = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    nextEffects.reverb.enabled = false;
    nextEffects.chorus.enabled = false;
    engine.setEffects(nextEffects);
    expect(context.createdNodes.length).toBeGreaterThan(initialNodeCount);
    engine.dispose();
  });

  it('returns false when playing before initialization', () => {
    const engine = createMusicStudioAudioEngine();
    expect(engine.playNote('C4')).toBe(false);
    expect(engine.readDominantFrequency()).toBeNull();
  });

  it('returns false when init fails', () => {
    const engine = createMusicStudioAudioEngine({
      createContext: () => {
        throw new Error('blocked');
      }
    });
    expect(engine.init()).toBe(false);
    expect(engine.playNote('C4')).toBe(false);
  });

  it('debounces identical notes inside the minimum interval', () => {
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({
      createContext: () => context,
      minNoteIntervalMs: 100
    });
    engine.init();
    expect(engine.playNote('C4')).toBe(true);
    expect(engine.playNote('C4')).toBe(false);
    engine.dispose();
  });

  it('exposes analyser frequency reads and effect settings', () => {
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({ createContext: () => context });
    engine.init();
    engine.setMasterVolume(0.5);
    engine.setInstrument('piano');
    expect(engine.getAnalyser()).toBeTruthy();
    expect(engine.readDominantFrequency()).toBeGreaterThanOrEqual(0);
    expect(engine.getEffects().reverb.enabled).toBe(true);
    engine.dispose();
  });

  it('resumes suspended contexts when playing', () => {
    const context = createMockAudioContext();
    context.state = 'suspended';
    const engine = createMusicStudioAudioEngine({
      createContext: () => context,
      minNoteIntervalMs: 0
    });
    engine.init();
    expect(engine.playNote('D4')).toBe(true);
    engine.dispose();
  });

  it('tears down chorus LFO even if stop throws', () => {
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({ createContext: () => context });
    engine.init();
    const chorus = context.createdOscillators.at(-1);
    if (chorus) {
      chorus.stop = () => {
        throw new Error('already stopped');
      };
    }
    engine.dispose();
    expect(engine.getActiveVoiceCount()).toBe(0);
  });

  it('reuses an existing initialized context', () => {
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({ createContext: () => context });
    expect(engine.init()).toBe(true);
    expect(engine.init()).toBe(true);
    expect(engine.audioContext).toBe(context);
    engine.dispose();
  });

  it('releases voices even when disconnect throws', () => {
    vi.useFakeTimers();
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({
      createContext: () => context,
      minNoteIntervalMs: 0
    });
    engine.init();
    engine.playNote('C4');
    const voiceOsc = context.createdOscillators.at(-1);
    if (voiceOsc) {
      voiceOsc.disconnect = () => {
        throw new Error('already disconnected');
      };
    }
    vi.advanceTimersByTime(getNoteDurationMs('synth') + 200);
    expect(engine.getActiveVoiceCount()).toBe(0);
    engine.dispose();
    vi.useRealTimers();
  });
});

/**
 * @param {(node: object) => void} [onDestinationConnect]
 */
function createMockAudioContext(onDestinationConnect) {
  /** @type {OscillatorNode[]} */
  const createdOscillators = [];
  /** @type {object[]} */
  const createdNodes = [];

  const destination = {
    connect() {
      if (onDestinationConnect) {
        onDestinationConnect(destination);
      }
    }
  };

  const context = {
    state: 'running',
    currentTime: 0,
    sampleRate: 44100,
    destination,
    createdOscillators,
    createdNodes,
    createOscillator() {
      const osc = {
        type: 'sine',
        isChorusLfo: false,
        frequency: { value: 0 },
        connect() {
          return osc;
        },
        start() {},
        stop() {},
        disconnect() {}
      };
      createdOscillators.push(osc);
      createdNodes.push(osc);
      return osc;
    },
    createGain() {
      const gain = {
        gain: createAudioParam(),
        connect() {
          return gain;
        },
        disconnect() {}
      };
      createdNodes.push(gain);
      return gain;
    },
    createAnalyser() {
      const analyser = {
        fftSize: 4096,
        frequencyBinCount: 2048,
        connect(node) {
          if (node === destination && onDestinationConnect) {
            onDestinationConnect(destination);
          }
          return analyser;
        },
        disconnect() {},
        getByteFrequencyData(buffer) {
          buffer.fill(0);
        }
      };
      createdNodes.push(analyser);
      return analyser;
    },
    createBiquadFilter() {
      const filter = {
        type: 'lowpass',
        frequency: { value: 0 },
        Q: { value: 0 },
        connect() {
          return filter;
        },
        disconnect() {}
      };
      createdNodes.push(filter);
      return filter;
    },
    createWaveShaper() {
      const shaper = {
        curve: null,
        oversample: '4x',
        connect() {
          return shaper;
        },
        disconnect() {}
      };
      createdNodes.push(shaper);
      return shaper;
    },
    createDelay() {
      const delay = {
        delayTime: { value: 0 },
        connect() {
          return delay;
        },
        disconnect() {}
      };
      createdNodes.push(delay);
      return delay;
    },
    resume() {
      return Promise.resolve();
    },
    close() {
      this.state = 'closed';
      return Promise.resolve();
    }
  };

  return context;
}

function createAudioParam() {
  return {
    value: 0,
    setValueAtTime(value) {
      this.value = value;
      return this;
    },
    exponentialRampToValueAtTime(value) {
      this.value = value;
      return this;
    },
    linearRampToValueAtTime(value) {
      this.value = value;
      return this;
    },
    cancelScheduledValues() {
      return this;
    }
  };
}
