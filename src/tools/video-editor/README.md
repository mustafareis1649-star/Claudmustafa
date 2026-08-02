# video-editor

Trim and re-compress a video, entirely client-side.

Implementation note: instead of WebCodecs/ffmpeg.wasm, this uses native
`HTMLMediaElement.captureStream()` + `MediaRecorder` — supported in current
Chrome, Edge, and Firefox without any extra dependency or WASM payload.
The source video plays in real time while its captured stream is recorded
between the chosen start/end points, at the selected bitrate (quality
preset). Nothing is uploaded; everything happens in the visitor's tab.

Trade-offs to know about:
- Safari does not support `captureStream` on `<video>`, so export is
  disabled there for now (the UI shows a message instead of a broken
  button).
- Because trimming happens by playing the source in real time, export
  takes roughly as long as the trimmed clip's duration (not instant).
- Output container is whatever the browser's `MediaRecorder` supports
  (MP4 where available, otherwise WebM) — true arbitrary format
  conversion (e.g. force MP4 on a browser that only records WebM) would
  need ffmpeg.wasm; that's a reasonable follow-up if it's ever needed.

Follows the same structure as the other tools:
- `components/` — `VideoEditorTool.jsx` (dropzone → trim → export UI),
  `HowItWorks.jsx`
- `logic/videoTools.js` — metadata reading, export/record logic, formatting helpers
- `i18n/` — same 9 languages as the rest of the app
