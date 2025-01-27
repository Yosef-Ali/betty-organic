export async function processImage(
  file: File,
): Promise<{ blob: Blob; isConverted: boolean }> {
  // If already WebP, return as-is
  if (file.type === 'image/webp') {
    return { blob: file, isConverted: false };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      // Convert to WebP
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Failed to convert image to WebP'));
            return;
          }
          resolve({ blob, isConverted: true });
        },
        'image/webp',
        0.8, // quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileExtension(file: File): string {
  // Use file type if available and valid
  if (file.type) {
    const subtype = file.type.split('/')[1];
    if (subtype && subtype !== 'octet-stream') {
      return subtype;
    }
  }

  // Fallback to filename extension
  return file.name.split('.').pop()?.toLowerCase() || 'jpg';
}
