// Runs entirely in the browser — reads bytes directly from the File object,
// no file is ever uploaded to a server. This is a small, purpose-built
// EXIF/TIFF parser (just the tags shown in the UI) rather than a full
// library, to avoid adding a new dependency for a single read-only tool.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const TAG_NAMES = {
  0x010f: 'make',
  0x0110: 'model',
  0x0131: 'software',
  0x0112: 'orientation',
  0x0132: 'dateTime',
  0x9003: 'dateTimeOriginal',
  0x829a: 'exposureTime',
  0x829d: 'fNumber',
  0x8827: 'iso',
  0x920a: 'focalLength',
  0xa002: 'pixelXDimension',
  0xa003: 'pixelYDimension',
  0xa434: 'lensModel',
};

const GPS_TAG_NAMES = {
  0x0001: 'gpsLatRef',
  0x0002: 'gpsLat',
  0x0003: 'gpsLonRef',
  0x0004: 'gpsLon',
};

function readString(view, offset, length) {
  let s = '';
  for (let i = 0; i < length; i++) {
    const c = view.getUint8(offset + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s.trim();
}

function readIfd(view, tiffStart, ifdOffset, little, tagNames, out) {
  const entryCount = view.getUint16(tiffStart + ifdOffset, little);
  for (let i = 0; i < entryCount; i++) {
    const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, little);
    const type = view.getUint16(entryOffset + 2, little);
    const count = view.getUint32(entryOffset + 4, little);
    const valueOffset = entryOffset + 8;
    const name = tagNames[tag];
    if (!name) continue;

    const typeSizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 9: 4, 10: 8 };
    const size = (typeSizes[type] || 4) * count;
    const dataAt = size > 4 ? tiffStart + view.getUint32(valueOffset, little) : valueOffset;

    let value;
    if (type === 2) {
      value = readString(view, dataAt, count);
    } else if (type === 5 || type === 10) {
      // Rational / signed rational: numerator/denominator, 8 bytes each unit.
      const num = type === 5 ? view.getUint32(dataAt, little) : view.getInt32(dataAt, little);
      const den = type === 5 ? view.getUint32(dataAt + 4, little) : view.getInt32(dataAt + 4, little);
      value = den !== 0 ? num / den : 0;
      if (count > 1) {
        // e.g. GPS coordinates: 3 rationals (deg, min, sec)
        const parts = [value];
        for (let j = 1; j < count; j++) {
          const n2 = type === 5
            ? view.getUint32(dataAt + j * 8, little)
            : view.getInt32(dataAt + j * 8, little);
          const d2 = type === 5
            ? view.getUint32(dataAt + j * 8 + 4, little)
            : view.getInt32(dataAt + j * 8 + 4, little);
          parts.push(d2 !== 0 ? n2 / d2 : 0);
        }
        value = parts;
      }
    } else if (type === 3) {
      value = view.getUint16(dataAt, little);
    } else if (type === 4) {
      value = view.getUint32(dataAt, little);
    } else {
      value = view.getUint8(dataAt);
    }
    out[name] = value;
  }
}

function dmsToDecimal(dms, ref) {
  if (!Array.isArray(dms) || dms.length < 3) return null;
  const [deg, min, sec] = dms;
  let dec = deg + min / 60 + sec / 3600;
  if (ref === 'S' || ref === 'W') dec = -dec;
  return dec;
}

/**
 * Reads the EXIF/TIFF metadata segment out of a JPEG file.
 * @param {File} file
 * @returns {Promise<Record<string, any>|null>} null if the file has no EXIF data
 */
export async function readExif(file) {
  const buffer = await file.slice(0, 256 * 1024).arrayBuffer();
  const view = new DataView(buffer);
  if (view.getUint16(0) !== 0xffd8) return null; // not a JPEG

  let offset = 2;
  let exifOffset = null;
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset);
    if (marker === 0xffe1) {
      exifOffset = offset + 4;
      break;
    }
    if ((marker & 0xff00) !== 0xff00) break;
    const segmentLength = view.getUint16(offset + 2);
    offset += 2 + segmentLength;
  }
  if (exifOffset == null) return null;
  if (readString(view, exifOffset, 4) !== 'Exif') return null;

  const tiffStart = exifOffset + 6;
  const byteOrder = view.getUint16(tiffStart);
  const little = byteOrder === 0x4949;
  const ifd0Offset = view.getUint32(tiffStart + 4, little);

  const tags = {};
  readIfd(view, tiffStart, ifd0Offset, little, TAG_NAMES, tags);

  // Exif sub-IFD (exposure, ISO, lens, etc.) is pointed to by tag 0x8769.
  const entryCount = view.getUint16(tiffStart + ifd0Offset, little);
  for (let i = 0; i < entryCount; i++) {
    const entryOffset = tiffStart + ifd0Offset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, little);
    if (tag === 0x8769) {
      const subIfdOffset = view.getUint32(entryOffset + 8, little);
      readIfd(view, tiffStart, subIfdOffset, little, TAG_NAMES, tags);
    }
    if (tag === 0x8825) {
      const gpsIfdOffset = view.getUint32(entryOffset + 8, little);
      const gps = {};
      readIfd(view, tiffStart, gpsIfdOffset, little, GPS_TAG_NAMES, gps);
      const lat = dmsToDecimal(gps.gpsLat, gps.gpsLatRef);
      const lon = dmsToDecimal(gps.gpsLon, gps.gpsLonRef);
      if (lat != null && lon != null) {
        tags.gpsLatitude = lat;
        tags.gpsLongitude = lon;
      }
    }
  }

  return Object.keys(tags).length ? tags : null;
}
