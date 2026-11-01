/**
 * The picture a reviewer attaches to their review.
 *
 * The photo is optional, but when there is one it is sent as a data URI in the
 * same request as the review itself — one round trip instead of two.
 *
 * Phone cameras produce 4-12 MB files. Sending them as they are would make the
 * review request heavy for no gain: a shop photo only has to be readable on a
 * phone screen. The picture is therefore resized and re-encoded in the browser
 * before it leaves, which keeps the review quick on a slow connection.
 */

/** The longest edge of the stored picture, in pixels. */
const MAX_EDGE = 1400;

/** The quality the picture is re-encoded with. */
const QUALITY = 0.82;

/** The types the browser is allowed to pick from. */
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/** The largest file the picker accepts before it is resized (5 MB). */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** What went wrong, in a sentence the visitor can act on. */
export class ReviewImageError extends Error {}

/** Is this a picture the picker accepts? */
export function isAcceptedImageType(type: string): boolean {
  return ACCEPTED_TYPES.includes(String(type).toLowerCase());
}

/**
 * Draw the picture on a canvas at the size it should be stored in.
 *
 * A picture that is already small enough is copied as it is, so a PNG with
 * transparency keeps its transparency.
 */
async function resize(file: File): Promise<string> {
  const dataUrl = await readFile(file);

  const image = await loadImage(dataUrl);
  const longestEdge = Math.max(image.width, image.height);

  if (longestEdge <= MAX_EDGE && file.size <= 400 * 1024) {
    return dataUrl;
  }

  const scale = Math.min(1, MAX_EDGE / longestEdge);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    // A browser without a canvas cannot resize, so the original is sent.
    return dataUrl;
  }

  // A transparent PNG turns into a JPEG, and a JPEG has no transparency —
  // without this the transparent parts would come out black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', QUALITY);
}

/** Read a file as a data URI. */
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new ReviewImageError('We could not read that photo.'));
    reader.readAsDataURL(file);
  });
}

/** Load an image element from a data URI. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new ReviewImageError('We could not read that photo.'));
    image.src = src;
  });
}

/**
 * Turn the file the visitor picked into a picture that is ready to send.
 *
 * Throws a `ReviewImageError` with a readable message when the file cannot be
 * used, so the form can explain what went wrong.
 */
export async function prepareReviewImage(file: File): Promise<string> {
  if (!file) {
    throw new ReviewImageError('Please choose a photo.');
  }

  if (!isAcceptedImageType(file.type)) {
    throw new ReviewImageError('Please choose a JPG, PNG or WEBP photo.');
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new ReviewImageError('That photo is too large — please pick one under 5 MB.');
  }

  try {
    return await resize(file);
  } catch (error) {
    if (error instanceof ReviewImageError) throw error;
    throw new ReviewImageError('We could not read that photo.');
  }
}
