// Lector de dimensiones (ancho/alto) para los cuatro formatos que la API
// acepta: PNG, GIF, JPEG y WebP. Lee solo las cabeceras, sin dependencias
// externas (se descartó `image-size` por advisories de DoS sin fix en sus
// parsers de ICNS/JXL/HEIF, formatos que acá ni siquiera se permiten).
//
// Todos los recorridos están acotados por la longitud del buffer, así que
// un archivo malformado devuelve null, nunca cuelga.

export type ImageDimensions = { width: number; height: number };

export function readImageDimensions(buffer: Buffer): ImageDimensions | null {
  return (
    readPng(buffer) ??
    readGif(buffer) ??
    readWebp(buffer) ??
    readJpeg(buffer) ??
    null
  );
}

function readPng(b: Buffer): ImageDimensions | null {
  // Firma PNG + chunk IHDR con las dimensiones en big-endian.
  if (
    b.length < 24 ||
    b[0] !== 0x89 ||
    b[1] !== 0x50 ||
    b[2] !== 0x4e ||
    b[3] !== 0x47
  ) {
    return null;
  }
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function readGif(b: Buffer): ImageDimensions | null {
  if (b.length < 10 || b[0] !== 0x47 || b[1] !== 0x49 || b[2] !== 0x46) {
    return null;
  }
  return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
}

function readWebp(b: Buffer): ImageDimensions | null {
  if (
    b.length < 30 ||
    b.toString('ascii', 0, 4) !== 'RIFF' ||
    b.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return null;
  }

  const format = b.toString('ascii', 12, 16);

  if (format === 'VP8 ') {
    // Lossy: dimensiones de 14 bits tras el start code (0x9d 0x01 0x2a).
    if (b.length < 30) return null;
    const width = b.readUInt16LE(26) & 0x3fff;
    const height = b.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }

  if (format === 'VP8L') {
    // Lossless: 1 byte de firma (0x2f) + 2 x 14 bits empaquetados.
    if (b.length < 25 || b[20] !== 0x2f) return null;
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }

  if (format === 'VP8X') {
    // Extended: canvas width-1 y height-1 en 3 bytes little-endian.
    if (b.length < 30) return null;
    const width = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const height = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    return { width, height };
  }

  return null;
}

function readJpeg(b: Buffer): ImageDimensions | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < b.length) {
    if (b[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = b[offset + 1];
    // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15 llevan las
    // dimensiones; SOF4 (0xc4), SOF8 (0xc8) y SOFC (0xcc) no son SOF.
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isSof) {
      const height = b.readUInt16BE(offset + 5);
      const width = b.readUInt16BE(offset + 7);
      return { width, height };
    }
    const segmentLength = b.readUInt16BE(offset + 2);
    if (segmentLength < 2) return null;
    offset += 2 + segmentLength;
  }
  return null;
}
