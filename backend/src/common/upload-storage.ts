import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';

// Carpeta local donde multer guarda los archivos subidos. ServeStaticModule
// (app.module.ts) la expone públicamente bajo /uploads.
export const UPLOAD_DIR = 'uploads';

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Config de almacenamiento en disco reutilizable. Antes estaba duplicada
// inline en content-sections.controller y rooms.controller.
//
// `prefix` es el comienzo del nombre de archivo generado; si no se pasa, se
// usa el nombre del campo del formulario (banner, images, etc.).
export function createImageDiskStorage(prefix?: string) {
  return diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadDir();
      cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const base = prefix ?? file.fieldname;
      cb(null, `${base}-${uniqueSuffix}${extname(file.originalname)}`);
    },
  });
}

// Ruta pública (la que se guarda en la base y consume el frontend) a partir
// del archivo ya guardado por multer.
export function toPublicUploadPath(file: Express.Multer.File): string {
  return `/uploads/${file.filename}`;
}
