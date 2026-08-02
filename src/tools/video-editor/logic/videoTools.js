// Framework-free helpers for the video editor. Everything runs on the
// visitor's device using native browser APIs (HTMLMediaElement.captureStream
// + MediaRecorder) — no file is ever uploaded, and no ffmpeg.wasm / WebCodecs
// dependency is required. Same pattern as the other tools' logic/ files.

export const MAX_FILE_BYTES = 500 * 1024 * 1024; // 500 MB, sanity guard

// Candidate output containers/codecs, best first. The first one the
// browser's MediaRecorder actually supports is used.
const MIME_CANDIDATES = [
  'video/mp4;codecs=avc1,mp4a',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return null;
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
}

export function isVideoEditingSupported() {
  return (
    typeof MediaRecorder !== 'undefined' &&
    (HTMLMediaElement.prototype.captureStream || HTMLMediaElement.prototype.mozCaptureStream) !== undefined
  );
}

// Quality presets, expressed as target video bitrate (bits/sec).
export const QUALITY_PRESETS = {
  high: { label: 'high', videoBitsPerSecond: 8_000_000 },
  medium: { label: 'medium', videoBitsPerSecond: 3_000_000 },
  low: { label: 'low', videoBitsPerSecond: 1_200_000 },
};

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Reads basic metadata (duration, width, height) from a video File by
 * loading it into an off-DOM <video> element. Caller is responsible for
 * revoking the returned object URL when done with it (or reuse it for
 * preview / export, then revoke).
 * @param {File} file
 * @returns {Promise<{ url: string, duration: number, width: number, height: number }>}
 */
export function loadVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement('video');
    el.preload = 'metadata';
    el.src = url;
    el.onloadedmetadata = () => {
      resolve({ url, duration: el.duration, width: el.videoWidth, height: el.videoHeight });
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this video file.'));
    };
  });
}

/**
 * Trims a video to [start, end] and re-encodes it at the requested quality,
 * entirely client-side. Plays the source <video> element in real time while
 * recording its captured stream, then stops at `end`.
 *
 * @param {Object} opts
 * @param {HTMLVideoElement} opts.videoEl - the preview element, already loaded with the source
 * @param {number} opts.start - trim start, seconds
 * @param {number} opts.end - trim end, seconds
 * @param {number} opts.videoBitsPerSecond - target bitrate for the export
 * @param {string} [opts.mimeType] - defaults to the best supported type
 * @param {(ratio: number) => void} [opts.onProgress] - 0..1
 * @returns {Promise<Blob>}
 */
export function exportTrimmedVideo({ videoEl, start, end, videoBitsPerSecond, mimeType, onProgress }) {
  return new Promise((resolve, reject) => {
    if (!isVideoEditingSupported()) {
      reject(new Error('unsupported'));
      return;
    }
    const type = mimeType || getSupportedMimeType();
    const captureFn = videoEl.captureStream || videoEl.mozCaptureStream;
    if (!captureFn) {
      reject(new Error('unsupported'));
      return;
    }

    let stream;
    let recorder;
    try {
      stream = captureFn.call(videoEl);
      recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond });
    } catch (err) {
      reject(err);
      return;
    }

    const chunks = [];
    let rafId = null;
    let settled = false;

    function cleanup() {
      if (rafId) cancelAnimationFrame(rafId);
      videoEl.removeEventListener('seeked', onSeeked);
      videoEl.muted = wasMuted;
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onerror = (e) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(e.error || new Error('Recording failed'));
    };
    recorder.onstop = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(new Blob(chunks, { type }));
    };

    const wasMuted = videoEl.muted;

    function tick() {
      if (videoEl.currentTime >= end || videoEl.ended || videoEl.paused) {
        videoEl.pause();
        if (recorder.state !== 'inactive') recorder.stop();
        return;
      }
      if (onProgress) onProgress(Math.min(1, (videoEl.currentTime - start) / Math.max(0.001, end - start)));
      rafId = requestAnimationFrame(tick);
    }

    function onSeeked() {
      videoEl.removeEventListener('seeked', onSeeked);
      recorder.start();
      videoEl.play().catch((err) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err);
      });
      rafId = requestAnimationFrame(tick);
    }

    videoEl.addEventListener('seeked', onSeeked);
    videoEl.currentTime = start;
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function extensionForMime(mime) {
  if (!mime) return 'webm';
  if (mime.includes('mp4')) return 'mp4';
  return 'webm';
}
