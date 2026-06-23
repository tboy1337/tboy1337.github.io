import { describe, expect, it } from 'vitest';
import * as GameUtils from '../../lib/game-utils.mjs';

describe('GameUtils.shuffleArray', () => {
  it('shuffles in place and returns the same array reference', () => {
    const input = [1, 2, 3, 4, 5];
    const result = GameUtils.shuffleArray(input, () => 0);
    expect(result).toBe(input);
    expect(input).toEqual([2, 3, 4, 5, 1]);
  });

  it('handles single element arrays', () => {
    const input = [42];
    GameUtils.shuffleArray(input, () => 0.5);
    expect(input).toEqual([42]);
  });

  it('uses Math.random when no random function is provided', () => {
    const input = [1, 2, 3, 4];
    const copy = [...input];
    GameUtils.shuffleArray(copy);
    expect(copy).toHaveLength(input.length);
  });

  it('handles sparse arrays without throwing', () => {
    const input = [1, , 3];
    GameUtils.shuffleArray(input, () => 0);
    expect(input.length).toBe(3);
  });
});

describe('GameUtils.hasRecordableContent', () => {
  it('returns true when recorded notes exist', () => {
    expect(GameUtils.hasRecordableContent([], [{ note: 'C4', time: 0 }])).toBe(true);
  });

  it('returns true when any layer has notes', () => {
    expect(GameUtils.hasRecordableContent([{ notes: [{ note: 'D4', time: 10 }] }], [])).toBe(true);
  });

  it('returns false when nothing is recorded', () => {
    expect(GameUtils.hasRecordableContent([{ notes: [] }], [])).toBe(false);
  });

  it('returns false when layer notes are missing', () => {
    expect(GameUtils.hasRecordableContent([{}], [])).toBe(false);
  });
});

describe('GameUtils.buildCompositionPayload', () => {
  it('creates a version 2 payload with cloned data', () => {
    const payload = GameUtils.buildCompositionPayload({
      name: 'Test Song',
      loopLayers: [{ notes: [{ note: 'C4', time: 0 }], name: 'Layer 1' }],
      layerTempos: [120, 140, 120, 120],
      currentLayerIndex: 0,
      instrument: 'piano',
      effects: { reverb: { enabled: true, wetness: 0.3 } },
      tempo: 120,
      timestamp: '2026-06-22T00:00:00.000Z'
    });

    expect(payload.version).toBe(2);
    expect(payload.name).toBe('Test Song');
    expect(payload.loopLayers[0].notes).toEqual([{ note: 'C4', time: 0 }]);
    expect(payload.effects.reverb.enabled).toBe(true);
  });
});

describe('GameUtils.restoreCompositionState', () => {
  it('restores multi-layer compositions', () => {
    const restored = GameUtils.restoreCompositionState({
      version: 2,
      loopLayers: [
        { notes: [{ note: 'C4', time: 0 }], name: 'Layer 1' },
        { notes: [{ note: 'E4', time: 50 }], name: 'Layer 2' }
      ],
      layerTempos: [100, 140, 120, 120],
      currentLayerIndex: 1
    });

    expect(restored.loopLayers).toHaveLength(2);
    expect(restored.currentLayerIndex).toBe(1);
    expect(restored.recordedNotes).toEqual([{ note: 'E4', time: 50 }]);
    expect(restored.layerTempos[1]).toBe(140);
  });

  it('clamps out-of-bounds currentLayerIndex to the last layer', () => {
    const restored = GameUtils.restoreCompositionState({
      version: 2,
      loopLayers: [
        { notes: [{ note: 'C4', time: 0 }], name: 'Layer 1' },
        { notes: [{ note: 'E4', time: 50 }], name: 'Layer 2' }
      ],
      layerTempos: [100, 140, 120, 120],
      currentLayerIndex: 99
    });

    expect(restored.currentLayerIndex).toBe(1);
    expect(restored.recordedNotes).toEqual([{ note: 'E4', time: 50 }]);
  });

  it('restores legacy v1 compositions into layer 1', () => {
    const restored = GameUtils.restoreCompositionState({
      notes: [{ note: 'G4', time: 25 }],
      tempo: 90
    });

    expect(restored.loopLayers).toHaveLength(1);
    expect(restored.layerTempos[0]).toBe(90);
    expect(restored.recordedNotes).toEqual([{ note: 'G4', time: 25 }]);
  });

  it('fills default layer names and empty recorded notes when layer is blank', () => {
    const restored = GameUtils.restoreCompositionState({
      version: 2,
      loopLayers: [{ notes: [] }],
      layerTempos: [100],
      currentLayerIndex: 0
    });

    expect(restored.loopLayers[0].name).toBe('Layer 1');
    expect(restored.recordedNotes).toEqual([]);
    expect(restored.layerTempos).toEqual([100]);
  });

  it('uses default tempos when layerTempos is missing in v2 payloads', () => {
    const restored = GameUtils.restoreCompositionState({
      version: 2,
      loopLayers: [{ notes: [{ note: 'A4', time: 0 }], name: 'Main' }],
      currentLayerIndex: 0
    });

    expect(restored.layerTempos).toEqual([120, 120, 120, 120]);
    expect(restored.recordedNotes).toEqual([{ note: 'A4', time: 0 }]);
  });

  it('restores legacy compositions with empty defaults', () => {
    const restored = GameUtils.restoreCompositionState({});

    expect(restored.loopLayers[0].notes).toEqual([]);
    expect(restored.layerTempos[0]).toBe(120);
    expect(restored.recordedNotes).toEqual([]);
  });

  it('clamps negative currentLayerIndex to zero', () => {
    const restored = GameUtils.restoreCompositionState({
      version: 2,
      loopLayers: [{ notes: [{ note: 'C4', time: 0 }], name: 'Layer 1' }],
      currentLayerIndex: -5
    });

    expect(restored.currentLayerIndex).toBe(0);
    expect(restored.recordedNotes).toEqual([{ note: 'C4', time: 0 }]);
  });

  it('handles empty loopLayers in v2 payloads', () => {
    const restored = GameUtils.restoreCompositionState({
      version: 2,
      loopLayers: [],
      currentLayerIndex: 2
    });

    expect(restored.loopLayers).toEqual([]);
    expect(restored.currentLayerIndex).toBe(0);
    expect(restored.recordedNotes).toEqual([]);
    expect(restored.layerTempos).toEqual([120, 120, 120, 120]);
  });

  it('fills missing layer notes arrays in v2 payloads', () => {
    const restored = GameUtils.restoreCompositionState({
      version: 2,
      loopLayers: [{ name: 'Layer without notes' }],
      currentLayerIndex: 0
    });

    expect(restored.loopLayers[0].notes).toEqual([]);
    expect(restored.recordedNotes).toEqual([]);
  });

  it('restores legacy compositions when notes are absent', () => {
    const restored = GameUtils.restoreCompositionState({ tempo: 80 });

    expect(restored.recordedNotes).toEqual([]);
    expect(restored.layerTempos[0]).toBe(80);
  });
});

describe('GameUtils tempo helpers', () => {
  it('scales note time based on layer tempo', () => {
    expect(GameUtils.scaleNoteTime(1000, 120)).toBe(1000);
    expect(GameUtils.scaleNoteTime(1000, 60)).toBe(2000);
  });

  it('calculates loop duration with padding', () => {
    expect(GameUtils.calculateLoopDuration(120, 1000, 500)).toBe(1500);
    expect(GameUtils.calculateLoopDuration(60, 1000)).toBe(2500);
  });
});

describe('GameUtils.parseCompositionSelection', () => {
  it('parses valid selections', () => {
    expect(GameUtils.parseCompositionSelection('1', 3)).toBe(0);
    expect(GameUtils.parseCompositionSelection('3', 3)).toBe(2);
  });

  it('rejects invalid selections', () => {
    expect(GameUtils.parseCompositionSelection('0', 3)).toBeNull();
    expect(GameUtils.parseCompositionSelection('4', 3)).toBeNull();
    expect(GameUtils.parseCompositionSelection('abc', 3)).toBeNull();
  });
});

describe('GameUtils.formatRecordingLength', () => {
  it('formats mm:ss strings', () => {
    expect(GameUtils.formatRecordingLength(0)).toBe('0:00');
    expect(GameUtils.formatRecordingLength(65000)).toBe('1:05');
    expect(GameUtils.formatRecordingLength(125000)).toBe('2:05');
  });
});

describe('GameUtils.validateAndSanitizeComposition', () => {
  it('sanitizes valid v2 compositions', () => {
    const sanitized = GameUtils.validateAndSanitizeComposition({
      name: 'My Song',
      version: 2,
      instrument: 'piano',
      tempo: 120,
      loopLayers: [{ notes: [{ note: 'C4', time: 0 }], name: 'Layer 1' }],
      layerTempos: [120],
      currentLayerIndex: 0,
      effects: {
        reverb: { enabled: true, roomSize: 0.3, damping: 0.5, wetness: 0.3 }
      }
    });

    expect(sanitized).not.toBeNull();
    expect(sanitized?.name).toBe('My Song');
    expect(sanitized?.instrument).toBe('piano');
  });

  it('rejects compositions without a name', () => {
    expect(GameUtils.validateAndSanitizeComposition({ instrument: 'piano' })).toBeNull();
  });

  it('sanitizes legacy compositions into v2 shape', () => {
    const sanitized = GameUtils.validateAndSanitizeComposition({
      name: 'Legacy',
      notes: [{ note: 'A4', time: 0 }],
      tempo: 80,
      instrument: 'strings'
    });

    expect(sanitized?.version).toBe(2);
    expect(sanitized?.loopLayers).toHaveLength(1);
    expect(sanitized?.tempo).toBe(80);
  });

  it('sanitizes malformed v2 layer data', () => {
    const sanitized = GameUtils.validateAndSanitizeComposition({
      name: 'Layers',
      version: 2,
      loopLayers: [null, { notes: 'bad', name: 'x'.repeat(80) }],
      layerTempos: [50, 300],
      currentLayerIndex: 4
    });

    expect(sanitized?.loopLayers).toHaveLength(2);
    expect(sanitized?.loopLayers[1].name).toHaveLength(50);
    expect(sanitized?.layerTempos[1]).toBe(240);
    expect(sanitized?.currentLayerIndex).toBe(1);
  });

  it('rejects whitespace-only composition names', () => {
    expect(GameUtils.validateAndSanitizeComposition({ name: '   ' })).toBeNull();
    expect(GameUtils.validateAndSanitizeComposition(null)).toBeNull();
  });

  it('keeps valid instruments and filter types', () => {
    const sanitized = GameUtils.validateAndSanitizeComposition({
      name: 'FX',
      instrument: 'bass',
      effects: {
        filter: { enabled: false, frequency: 500, Q: 2, type: 'highpass' }
      }
    });

    expect(sanitized?.instrument).toBe('bass');
    expect(sanitized?.effects.filter.type).toBe('highpass');
  });

  it('pads layer tempos when fewer tempos than layers exist', () => {
    const sanitized = GameUtils.validateAndSanitizeComposition({
      name: 'Pad',
      version: 2,
      loopLayers: [
        { notes: [], name: 'A' },
        { notes: [], name: 'B' },
        { notes: [], name: 'C' }
      ],
      layerTempos: [90]
    });

    expect(sanitized?.layerTempos).toEqual([90, 120, 120]);
  });

  it('handles empty v2 loop layers', () => {
    const sanitized = GameUtils.validateAndSanitizeComposition({
      name: 'Empty',
      version: 2,
      loopLayers: []
    });

    expect(sanitized?.loopLayers).toEqual([]);
    expect(sanitized?.currentLayerIndex).toBe(0);
  });

  it('applies default effect values when effects are missing or invalid', () => {
    const sanitized = GameUtils.validateAndSanitizeComposition({ name: 'Defaults' });
    expect(sanitized?.effects.reverb.enabled).toBe(true);
    expect(sanitized?.effects.filter.type).toBe('lowpass');

    const invalidEffects = GameUtils.validateAndSanitizeComposition({
      name: 'Bad FX',
      effects: 'nope'
    });
    expect(invalidEffects?.effects.distortion.amount).toBe(25);
  });
});

describe('GameUtils.sanitizeCompositionList', () => {
  it('returns empty results for non-array storage', () => {
    expect(GameUtils.sanitizeCompositionList('bad')).toEqual({
      compositions: [],
      removedCount: 0
    });
  });
  it('removes invalid entries and keeps valid ones', () => {
    const result = GameUtils.sanitizeCompositionList([
      { name: 'Valid', instrument: 'bass', tempo: 100 },
      { instrument: 'piano' },
      'not-an-object'
    ]);

    expect(result.compositions).toHaveLength(1);
    expect(result.removedCount).toBe(2);
    expect(result.compositions[0].name).toBe('Valid');
  });
});
