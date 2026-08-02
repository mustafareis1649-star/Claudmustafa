// Runs entirely in the browser (Web Audio API decode/encode) — no file is
// ever uploaded to a server. Outputs a WAV file, so no codec/container
// dependency is needed (unlike video, which needs ffmpeg.wasm for that).

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Decodes an audio file so the UI can show its duration and let the user
 * pick a start/end range.
 * @param {File} file
 * @returns {Promise<AudioBuffer>}
 */
export async function decodeAudio(file) {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const buffer = await audioCtx.decodeAudioData(arrayBuffer);
  audioCtx.close();
  return buffer;
}

/**
 * Trims an already-decoded AudioBuffer to [startSec, endSec] and returns a
 * downloadable WAV blob.
 * @param {AudioBuffer} buffer
 * @param {number} startSec
 * @param {number} endSec
 * @param {string} originalName
 * @returns {{ blob: Blob, fileName: string }}
 */
export function trimAudioBuffer(buffer, startSec, endSec, originalName) {
  const sampleRate = buffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(buffer.length, Math.floor(endSec * sampleRate));
  const frameCount = Math.max(0, endSample - startSample);

  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const offlineCtx = new OfflineCtx(buffer.numberOfChannels, frameCount, sampleRate);
  const trimmed = offlineCtx.createBuffer(buffer.numberOfChannels, frameCount, sampleRate);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const channelData = buffer.getChannelData(ch).subarray(startSample, endSample);
    trimmed.copyToChannel(channelData, ch);
  }

  const blob = audioBufferToWav(trimmed);
  const fileName = originalName.replace(/\.[^.]+$/, '') + '-trimmed.wav';
  return { blob, fileName };
}

// Standard 16-bit PCM WAV encoder — small and dependency-free, so every
// audio tool in this category can reuse it instead of pulling in ffmpeg.wasm
// just to write a .wav file.
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = [];
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}
