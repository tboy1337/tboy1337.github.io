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
  applyEffectSettings,
  applyEffectDisableBypass,
  effectsRequireStructuralRebuild,
  createMusicStudioAudioEngine,
  createInstrumentOscillator
} from '../../lib/music-studio-audio.mjs';

describe('MusicStudioAudio.makeDistortionCurve', () => {
  it('returns a curve with expected length and bounded values', () => {
    const curve = makeDistortionCurve(40);
    expect(curve).toHaveLength(44100);
    expect(curve[0]).toBeLessThan(0);
    expect(curve[curve.length - 1]).toBeGreaterThan(0);
  });

  it('falls back to a default amount when input is not numeric', () => {
    const defaultCurve = makeDistortionCurve(50);
    const invalidCurve = makeDistortionCurve(/** @type {number} */ (/** @type {unknown} */ ('heavy')));
    expect(invalidCurve).toEqual(defaultCurve);
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

  it('returns the minimum frequency bin when the spectrum is flat', () => {
    const fftSize = 2048;
    const sampleRate = 44100;
    const bins = new Uint8Array(fftSize / 2);
    const estimate = estimateDominantFrequency(bins, sampleRate, fftSize, 120);
    expect(estimate).toBeCloseTo((Math.floor((120 * fftSize) / sampleRate) * sampleRate) / fftSize, 1);
  });
});

describe('MusicStudioAudio.createInstrumentOscillator', () => {
  it('selects oscillator waveforms per instrument', () => {
    const context = createMockAudioContext();
    expect(createInstrumentOscillator(/** @type {AudioContext} */ (context), 440, 'piano').type)
      .toBe('triangle');
    expect(createInstrumentOscillator(/** @type {AudioContext} */ (context), 440, 'strings').type)
      .toBe('sawtooth');
    expect(createInstrumentOscillator(/** @type {AudioContext} */ (context), 440, 'bass').type)
      .toBe('square');
    expect(createInstrumentOscillator(/** @type {AudioContext} */ (context), 440, 'synth').type)
      .toBe('sawtooth');
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
    expect(chain.input).toBeTruthy();
    expect(chain.output).toBeTruthy();
    expect(chain.input).not.toBe(chain.output);
    expect(chain.nodes[0]).toBe(chain.input);
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
    expect(chain.input).toBeTruthy();
    expect(chain.output).toBeTruthy();
    expect(chain.chorusLFO).toBeNull();
  });

  it('builds chains when only one effect type is enabled', () => {
    const context = createMockAudioContext();
    const effectKeys = ['filter', 'distortion', 'delay', 'reverb', 'chorus'];

    for (const enabledKey of effectKeys) {
      const effects = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
      for (const key of effectKeys) {
        effects[key].enabled = key === enabledKey;
      }
      const chain = buildSharedEffectChain(/** @type {AudioContext} */ (context), effects);
      expect(chain.output).toBeTruthy();
      if (enabledKey === 'chorus') {
        expect(chain.chorusLFO).toBeTruthy();
      } else {
        expect(chain.chorusLFO).toBeNull();
      }
    }
  });
});

describe('MusicStudioAudio.effectsRequireStructuralRebuild', () => {
  it('returns false when only numeric effect parameters change', () => {
    const previous = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    const next = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    next.reverb.wetness = 0.9;
    next.distortion.amount = 80;
    next.filter.frequency = 400;
    expect(effectsRequireStructuralRebuild(previous, next)).toBe(false);
  });

  it('returns true when an effect is enabled or disabled', () => {
    const previous = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    const next = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    next.reverb.enabled = false;
    expect(effectsRequireStructuralRebuild(previous, next)).toBe(true);
  });

  it('returns true when the filter type changes', () => {
    const previous = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    const next = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    next.filter.type = 'highpass';
    expect(effectsRequireStructuralRebuild(previous, next)).toBe(true);
  });
});

describe('MusicStudioAudio.applyEffectSettings', () => {
  it('updates live node parameters without rebuilding the chain', () => {
    const context = createMockAudioContext();
    const chain = buildSharedEffectChain(/** @type {AudioContext} */ (context), DEFAULT_EFFECTS);
    const effects = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    effects.filter.frequency = 400;
    effects.distortion.amount = 80;
    effects.distortion.wetness = 0.9;
    effects.delay.wetness = 0.8;
    effects.reverb.wetness = 0.7;
    effects.chorus.wetness = 0.6;
    effects.chorus.rate = 2.5;

    applyEffectSettings(chain.handles, effects);

    expect(chain.handles.filter?.node.frequency.value).toBe(400);
    expect(chain.handles.distortion?.wetGain.gain.value).toBe(0.9);
    expect(chain.handles.distortion?.dryGain.gain.value).toBeCloseTo(0.1, 5);
    expect(chain.handles.delay?.wetGain.gain.value).toBe(0.8);
    expect(chain.handles.reverb?.reverbGain.gain.value).toBe(0.7);
    expect(chain.handles.chorus?.chorusGain.gain.value).toBe(0.6);
    expect(chain.handles.chorus?.lfo.frequency.value).toBe(2.5);
  });

  it('clamps filter frequency to the audible range', () => {
    const context = createMockAudioContext();
    const chain = buildSharedEffectChain(/** @type {AudioContext} */ (context), DEFAULT_EFFECTS);
    const effects = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    effects.filter.frequency = 0;

    applyEffectSettings(chain.handles, effects);

    expect(chain.handles.filter?.node.frequency.value).toBe(20);
  });
});

describe('MusicStudioAudio.applyEffectDisableBypass', () => {
  it('bypasses wet effects immediately when they are turned off', () => {
    const context = createMockAudioContext();
    const chain = buildSharedEffectChain(/** @type {AudioContext} */ (context), DEFAULT_EFFECTS);
    const previous = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    const next = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    next.reverb.enabled = false;
    next.distortion.enabled = false;
    next.filter.enabled = false;

    applyEffectDisableBypass(chain.handles, previous, next);

    expect(chain.handles.reverb?.reverbGain.gain.value).toBe(0);
    expect(chain.handles.reverb?.dryGain.gain.value).toBe(1);
    expect(chain.handles.distortion?.wetGain.gain.value).toBe(0);
    expect(chain.handles.filter?.node.frequency.value).toBe(20000);
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

  it('routes voiceBus through the effect chain head, not the tail', () => {
    /** @type {Array<{ from: object; to: object }>} */
    const connections = [];
    const context = createConnectionTrackingAudioContext(connections);

    const engine = createMusicStudioAudioEngine({
      createContext: () => context,
      minNoteIntervalMs: 0
    });
    engine.init();

    const { head, tail } = engine.getEffectChainEndpoints();
    expect(head).toBeTruthy();
    expect(tail).toBeTruthy();
    expect(head).not.toBe(tail);

    const voiceBusConnections = connections.filter((link) => link.from === context.voiceBus);
    expect(voiceBusConnections).toHaveLength(1);
    expect(voiceBusConnections[0]?.to).toBe(head);

    const tailConnections = connections.filter((link) => link.from === tail);
    expect(tailConnections.some((link) => link.to === context.masterGain)).toBe(true);

    engine.dispose();
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
    vi.useFakeTimers();
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({ createContext: () => context });
    engine.init();

    const initialNodeCount = context.createdNodes.length;
    const nextEffects = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    nextEffects.reverb.enabled = false;
    nextEffects.chorus.enabled = false;
    engine.setEffects(nextEffects);
    vi.advanceTimersByTime(120);
    expect(context.createdNodes.length).toBeGreaterThan(initialNodeCount);
    engine.dispose();
    vi.useRealTimers();
  });

  it('applies wetness-only changes in place without creating new nodes', () => {
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({ createContext: () => context });
    engine.init();
    const nodeCountAfterInit = context.createdNodes.length;

    const tweaked = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    tweaked.reverb.wetness = 0.95;
    tweaked.delay.wetness = 0.85;
    engine.setEffects(tweaked);

    expect(context.createdNodes.length).toBe(nodeCountAfterInit);
    expect(engine.getEffects().reverb.wetness).toBe(0.95);
    expect(engine.getEffects().delay.wetness).toBe(0.85);
    engine.dispose();
  });

  it('does not reset the structural rebuild deadline on repeated setEffects calls', () => {
    vi.useFakeTimers();
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({
      createContext: () => context,
      minNoteIntervalMs: 0
    });
    engine.init();
    engine.playNote('C4');

    const tweaked = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    tweaked.reverb.enabled = false;
    engine.setEffects(tweaked);
    engine.setEffects(tweaked);
    vi.advanceTimersByTime(120);
    expect(engine.playNote('E4')).toBe(true);
    engine.dispose();
    vi.useRealTimers();
  });

  it('returns false when playing before initialization', () => {
    const engine = createMusicStudioAudioEngine();
    expect(engine.playNote('C4')).toBe(false);
    expect(engine.readDominantFrequency()).toBeNull();
    engine.setEffects(JSON.parse(JSON.stringify(DEFAULT_EFFECTS)));
    expect(engine.getEffects().reverb.enabled).toBe(true);
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

  it('does not play notes while the audio context is suspended', () => {
    const context = createMockAudioContext();
    context.state = 'suspended';
    const engine = createMusicStudioAudioEngine({
      createContext: () => context,
      minNoteIntervalMs: 0
    });
    engine.init();
    expect(engine.playNote('D4')).toBe(false);
    context.state = 'running';
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

  it('disables all effects without leaving a chorus LFO running', () => {
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({ createContext: () => context });
    engine.init();
    const disabled = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    disabled.reverb.enabled = false;
    disabled.delay.enabled = false;
    disabled.chorus.enabled = false;
    disabled.distortion.enabled = false;
    disabled.filter.enabled = false;
    engine.setEffects(disabled);
    expect(engine.playNote('C4')).toBe(true);
    engine.dispose();
    expect(engine.getActiveVoiceCount()).toBe(0);
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

  it('survives teardown when effect nodes throw on disconnect', () => {
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({ createContext: () => context });
    engine.init();
    context.createdNodes.forEach((node) => {
      node.disconnect = () => {
        throw new Error('disconnect failed');
      };
    });
    expect(() => engine.dispose()).not.toThrow();
    expect(engine.audioContext).toBeNull();
  });

  it('reinitializes cleanly after the audio context is closed', () => {
    let context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({
      createContext: () => {
        if (context.state === 'closed') {
          context = createMockAudioContext();
        }
        return context;
      }
    });
    engine.init();
    expect(engine.playNote('C4')).toBe(true);
    context.state = 'closed';
    expect(engine.playNote('D4')).toBe(false);
    expect(engine.init()).toBe(true);
    expect(engine.playNote('D4')).toBe(true);
    expect(engine.destinationConnectionCount).toBe(1);
    engine.dispose();
  });

  it('rebuilds the effect chain during active voices without waiting for release', () => {
    vi.useFakeTimers();
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({
      createContext: () => context,
      minNoteIntervalMs: 0
    });
    engine.init();
    const nodeCountBefore = context.createdNodes.length;
    engine.playNote('C4');

    const tweaked = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    tweaked.reverb.enabled = false;
    engine.setEffects(tweaked);
    vi.advanceTimersByTime(120);
    expect(context.createdNodes.length).toBeGreaterThan(nodeCountBefore);
    expect(engine.getActiveVoiceCount()).toBe(1);
    expect(engine.playNote('E4')).toBe(true);
    engine.dispose();
    vi.useRealTimers();
  });

  it('debounces rapid effect changes into a single rebuild', () => {
    vi.useFakeTimers();
    const context = createMockAudioContext();
    const engine = createMusicStudioAudioEngine({ createContext: () => context });
    engine.init();

    const tweaked = JSON.parse(JSON.stringify(DEFAULT_EFFECTS));
    tweaked.reverb.enabled = false;
    engine.setEffects(tweaked);
    engine.setEffects(tweaked);
    engine.setEffects(tweaked);
    vi.advanceTimersByTime(120);

    expect(engine.playNote('C4')).toBe(true);
    engine.dispose();
    vi.useRealTimers();
  });

  it('ignores resume failures on suspended contexts', async () => {
    const context = createMockAudioContext();
    context.state = 'suspended';
    context.resume = () => Promise.reject(new Error('blocked'));
    const engine = createMusicStudioAudioEngine({
      createContext: () => context,
      minNoteIntervalMs: 0
    });
    engine.init();
    expect(engine.playNote('E4')).toBe(false);
    engine.dispose();
  });

  it('does not change master volume before initialization', () => {
    const engine = createMusicStudioAudioEngine();
    expect(() => engine.setMasterVolume(0.8)).not.toThrow();
  });

  it('releases voices when oscillator stop throws', () => {
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
      voiceOsc.stop = () => {
        throw new Error('already stopped');
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
function createConnectionTrackingAudioContext(connections) {
  let gainIndex = 0;
  const base = createMockAudioContext();
  const context = {
    ...base,
    voiceBus: null,
    masterGain: null,
    createGain() {
      const gain = {
        gain: createAudioParam(),
        connect(node) {
          connections.push({ from: gain, to: node });
          return node;
        },
        disconnect() {}
      };
      if (gainIndex === 0) {
        context.voiceBus = gain;
      } else if (gainIndex === 1) {
        context.masterGain = gain;
      }
      gainIndex += 1;
      context.createdNodes.push(gain);
      return gain;
    }
  };
  return context;
}

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
