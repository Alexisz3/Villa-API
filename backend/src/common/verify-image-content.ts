import { BadRequestException } from '@nestjs/common';
import { readFile, unlink } from 'fs/promises';

// El fileFilter de multer solo puede confiar en el Content-Type que declara
// el cliente (fácil de falsificar) y en la extensión del nombre de archivo
// original (también la controla quien sube el archivo). Esto valida los
// bytes reales del archivo YA GUARDADO en disco, así que un .html/.svg
// disfrazado de imagen se detecta y se borra antes de quedar servido desde
// /uploads.
export function detectRealImageType(
  buffer: Buffer,
): 'jpeg' | 'png' | 'webp' | 'gif' | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpeg';
  }

  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return 'gif';
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp';
  }

  return null;
}

async function isRealImage(file: Express.Multer.File): Promise<boolean> {
  const buffer = await readFile(file.path);
  return detectRealImageType(buffer) !== null;
}

// Valida un único archivo ya guardado; si no es una imagen real, lo borra y
// rechaza la request.
export async function assertUploadedFileIsRealImage(
  file: Express.Multer.File,
): Promise<void> {
  if (!(await isRealImage(file))) {
    await unlink(file.path).catch(() => {});
    throw new BadRequestException('El archivo subido no es una imagen válida.');
  }
}

// Valida un lote de archivos (ej. banner + galería en la misma request). Si
// alguno no es una imagen real, borra TODOS los archivos del lote (para no
// dejar huérfanos los que sí eran válidos) y rechaza la request.
export async function assertUploadedFilesAreRealImages(
  files: Express.Multer.File[],
): Promise<void> {
  if (files.length === 0) return;

  const results = await Promise.all(files.map((file) => isRealImage(file)));
  const allValid = results.every(Boolean);

  if (!allValid) {
    await Promise.all(files.map((file) => unlink(file.path).catch(() => {})));
    throw new BadRequestException(
      'Alguno de los archivos subidos no es una imagen válida.',
    );
  }
}
