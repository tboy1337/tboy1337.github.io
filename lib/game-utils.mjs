/**
 * Pure helpers shared by games.js and unit tests.
 */

const VALID_INSTRUMENTS = new Set(['synth', 'piano', 'strings', 'bass']);
const MIN_TEMPO = 40;
const MAX_TEMPO = 240;
const MAX_LAYERS = 4;
const MAX_NOTES_PER_LAYER = 500;
const FILTER_TYPES = new Set([
  'lowpass',
  'highpass',
  'bandpass',
  'lowshelf',
  'highshelf',
  'peaking',
  'notch',
  'allpass'
]);

/**
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @returns {number}
 */
function clampNumber(value, min, max, fallback) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * @param {unknown} value
 * @param {boolean} fallback
 * @returns {boolean}
 */
function clampBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * @param {unknown} effects
 * @returns {object}
 */
function sanitizeEffects(effects) {
  const defaults = {
    reverb: { enabled: true, roomSize: 0.3, damping: 0.5, wetness: 0.3 },
    delay: { enabled: true, time: 0.3, feedback: 0.3, wetness: 0.3 },
    chorus: { enabled: true, rate: 1.5, depth: 0.3, wetness: 0.5 },
    distortion: { enabled: true, amount: 25, wetness: 0.5 },
    filter: { enabled: true, frequency: 1000, Q: 8, type: 'lowpass' }
  };

  if (!effects || typeof effects !== 'object') {
    return JSON.parse(JSON.stringify(defaults));
  }

  const raw = /** @type {Record<string, Record<string, unknown>>} */ (effects);

  return {
    reverb: {
      enabled: clampBoolean(raw.reverb?.enabled, defaults.reverb.enabled),
      roomSize: clampNumber(raw.reverb?.roomSize, 0, 1, defaults.reverb.roomSize),
      damping: clampNumber(raw.reverb?.damping, 0, 1, defaults.reverb.damping),
      wetness: clampNumber(raw.reverb?.wetness, 0, 1, defaults.reverb.wetness)
    },
    delay: {
      enabled: clampBoolean(raw.delay?.enabled, defaults.delay.enabled),
      time: clampNumber(raw.delay?.time, 0, 2, defaults.delay.time),
      feedback: clampNumber(raw.delay?.feedback, 0, 0.95, defaults.delay.feedback),
      wetness: clampNumber(raw.delay?.wetness, 0, 1, defaults.delay.wetness)
    },
    chorus: {
      enabled: clampBoolean(raw.chorus?.enabled, defaults.chorus.enabled),
      rate: clampNumber(raw.chorus?.rate, 0, 10, defaults.chorus.rate),
      depth: clampNumber(raw.chorus?.depth, 0, 1, defaults.chorus.depth),
      wetness: clampNumber(raw.chorus?.wetness, 0, 1, defaults.chorus.wetness)
    },
    distortion: {
      enabled: clampBoolean(raw.distortion?.enabled, defaults.distortion.enabled),
      amount: clampNumber(raw.distortion?.amount, 0, 100, defaults.distortion.amount),
      wetness: clampNumber(raw.distortion?.wetness, 0, 1, defaults.distortion.wetness)
    },
    filter: {
      enabled: clampBoolean(raw.filter?.enabled, defaults.filter.enabled),
      frequency: clampNumber(raw.filter?.frequency, 20, 20000, defaults.filter.frequency),
      Q: clampNumber(raw.filter?.Q, 0.1, 20, defaults.filter.Q),
      type: typeof raw.filter?.type === 'string' && FILTER_TYPES.has(raw.filter.type)
        ? raw.filter.type
        : defaults.filter.type
    }
  };
}

/**
 * @param {unknown} composition
 * @returns {object | null}
 */
export function validateAndSanitizeComposition(composition) {
  if (!composition || typeof composition !== 'object') {
    return null;
  }

  const raw = /** @type {Record<string, unknown>} */ (composition);
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 100) : '';
  if (!name) {
    return null;
  }

  const instrument = typeof raw.instrument === 'string' && VALID_INSTRUMENTS.has(raw.instrument)
    ? raw.instrument
    : 'synth';
  const tempo = clampNumber(raw.tempo, MIN_TEMPO, MAX_TEMPO, 120);
  const effects = sanitizeEffects(raw.effects);

  if (raw.version === 2 && Array.isArray(raw.loopLayers)) {
    const loopLayers = raw.loopLayers.slice(0, MAX_LAYERS).map((layer, layerIndex) => {
      if (!layer || typeof layer !== 'object') {
        return { notes: [], name: `Layer ${layerIndex + 1}` };
      }
      const layerRecord = /** @type {Record<string, unknown>} */ (layer);
      const notes = Array.isArray(layerRecord.notes)
        ? layerRecord.notes.slice(0, MAX_NOTES_PER_LAYER)
        : [];
      const layerName = typeof layerRecord.name === 'string'
        ? layerRecord.name.slice(0, 50)
        : `Layer ${layerIndex + 1}`;
      return { notes, name: layerName };
    });
    const layerTempos = Array.isArray(raw.layerTempos)
      ? raw.layerTempos.slice(0, MAX_LAYERS).map((value) => clampNumber(value, MIN_TEMPO, MAX_TEMPO, 120))
      : [tempo, 120, 120, 120];
    while (layerTempos.length < loopLayers.length) {
      layerTempos.push(120);
    }
    const rawIndex = typeof raw.currentLayerIndex === 'number' ? raw.currentLayerIndex : 0;
    const currentLayerIndex = loopLayers.length === 0
      ? 0
      : Math.min(Math.max(rawIndex, 0), loopLayers.length - 1);

    return {
      name,
      version: 2,
      loopLayers,
      layerTempos,
      currentLayerIndex,
      instrument,
      effects,
      tempo,
      timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString()
    };
  }

  const notes = Array.isArray(raw.notes) ? raw.notes.slice(0, MAX_NOTES_PER_LAYER) : [];
  return {
    name,
    version: 2,
    loopLayers: [{ notes, name: 'Layer 1' }],
    layerTempos: [tempo, 120, 120, 120],
    currentLayerIndex: 0,
    instrument,
    effects,
    tempo,
    timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : new Date().toISOString(),
    notes
  };
}

/**
 * @param {unknown[]} saved
 * @returns {{ compositions: object[]; removedCount: number }}
 */
export function sanitizeCompositionList(saved) {
  if (!Array.isArray(saved)) {
    return { compositions: [], removedCount: 0 };
  }

  const compositions = [];
  let removedCount = 0;

  for (const entry of saved) {
    const sanitized = validateAndSanitizeComposition(entry);
    if (sanitized) {
      compositions.push(sanitized);
    } else {
      removedCount += 1;
    }
  }

  return { compositions, removedCount };
}

/**
 * @template T
 * @param {T[]} array
 * @param {() => number} [random]
 * @returns {T[]}
 */
export function shuffleArray(array, random = Math.random) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const current = array[i];
    const swap = array[j];
    if (current !== undefined && swap !== undefined) {
      array[i] = swap;
      array[j] = current;
    }
  }
  return array;
}

/**
 * @param {{ notes?: unknown[] }[]} loopLayers
 * @param {unknown[]} recordedNotes
 * @returns {boolean}
 */
export function hasRecordableContent(loopLayers, recordedNotes) {
  if (recordedNotes.length > 0) {
    return true;
  }
  return loopLayers.some((layer) => layer.notes && layer.notes.length > 0);
}

/**
 * @param {{
 *   name: string;
 *   loopLayers: { notes: unknown[]; name: string }[];
 *   layerTempos: number[];
 *   currentLayerIndex: number;
 *   instrument: string;
 *   effects: object;
 *   tempo: number;
 *   timestamp: string;
 * }} input
 * @returns {object}
 */
export function buildCompositionPayload(input) {
  return {
    name: input.name,
    version: 2,
    loopLayers: input.loopLayers.map((layer) => ({
      notes: [...layer.notes],
      name: layer.name
    })),
    layerTempos: [...input.layerTempos],
    currentLayerIndex: input.currentLayerIndex,
    instrument: input.instrument,
    effects: JSON.parse(JSON.stringify(input.effects)),
    tempo: input.tempo,
    timestamp: input.timestamp
  };
}

/**
 * @param {{
 *   version?: number;
 *   loopLayers?: { notes?: unknown[]; name?: string }[];
 *   layerTempos?: number[];
 *   currentLayerIndex?: number;
 *   notes?: unknown[];
 *   tempo?: number;
 * }} composition
 * @returns {{
 *   loopLayers: { notes: unknown[]; name: string }[];
 *   layerTempos: number[];
 *   currentLayerIndex: number;
 *   recordedNotes: unknown[];
 * }}
 */
export function restoreCompositionState(composition) {
  if (composition.version === 2 && Array.isArray(composition.loopLayers)) {
    const loopLayers = composition.loopLayers.map((layer, layerIndex) => ({
      notes: [...(layer.notes || [])],
      name: layer.name || `Layer ${layerIndex + 1}`
    }));
    const layerTempos = composition.layerTempos || [120, 120, 120, 120];
    const rawIndex = composition.currentLayerIndex || 0;
    const currentLayerIndex = loopLayers.length === 0
      ? 0
      : Math.min(Math.max(rawIndex, 0), loopLayers.length - 1);
    const recordedNotes = loopLayers[currentLayerIndex]?.notes
      ? [...loopLayers[currentLayerIndex].notes]
      : [];
    return { loopLayers, layerTempos, currentLayerIndex, recordedNotes };
  }

  const loopLayers = [{ notes: [...(composition.notes || [])], name: 'Layer 1' }];
  const layerTempos = [composition.tempo || 120, 120, 120, 120];
  return {
    loopLayers,
    layerTempos,
    currentLayerIndex: 0,
    recordedNotes: [...(composition.notes || [])]
  };
}

/**
 * @param {number} time
 * @param {number} layerTempo
 * @returns {number}
 */
export function scaleNoteTime(time, layerTempo) {
  const tempoScale = 120 / layerTempo;
  return time * tempoScale;
}

/**
 * @param {number} layerTempo
 * @param {number} lastNoteTime
 * @param {number} [paddingMs]
 * @returns {number}
 */
export function calculateLoopDuration(layerTempo, lastNoteTime, paddingMs = 500) {
  return scaleNoteTime(lastNoteTime, layerTempo) + paddingMs;
}

/**
 * @param {string} choice
 * @param {number} savedLength
 * @returns {number|null}
 */
export function parseCompositionSelection(choice, savedLength) {
  const index = parseInt(choice, 10) - 1;
  if (Number.isNaN(index) || index < 0 || index >= savedLength) {
    return null;
  }
  return index;
}

/**
 * @param {number} totalMs
 * @returns {string}
 */
export function formatRecordingLength(totalMs) {
  const seconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}
