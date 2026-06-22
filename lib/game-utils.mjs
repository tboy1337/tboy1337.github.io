/**
 * Pure helpers shared by games.js and unit tests.
 */

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
