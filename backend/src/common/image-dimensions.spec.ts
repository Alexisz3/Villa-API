import { readImageDimensions } from './image-dimensions';

// Imágenes 1x1 reales, en base64.
const PNG_1x1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const GIF_1x1 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// JPEG 1x1 (baseline).
const JPEG_1x1 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';

describe('readImageDimensions', () => {
  it('reads a PNG header', () => {
    expect(readImageDimensions(Buffer.from(PNG_1x1, 'base64'))).toEqual({
      width: 1,
      height: 1,
    });
  });

  it('reads a GIF header', () => {
    expect(readImageDimensions(Buffer.from(GIF_1x1, 'base64'))).toEqual({
      width: 1,
      height: 1,
    });
  });

  it('reads a JPEG SOF marker', () => {
    expect(readImageDimensions(Buffer.from(JPEG_1x1, 'base64'))).toEqual({
      width: 1,
      height: 1,
    });
  });

  it('returns null for a non-image buffer', () => {
    expect(readImageDimensions(Buffer.from('not an image at all'))).toBeNull();
  });

  it('returns null for a truncated PNG rather than throwing', () => {
    const png = Buffer.from(PNG_1x1, 'base64').subarray(0, 12);
    expect(readImageDimensions(png)).toBeNull();
  });
});
