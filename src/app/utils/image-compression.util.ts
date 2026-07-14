/**
 * Image compression utility to reduce file size before upload
 * Compresses images to JPEG format with configurable quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export class ImageCompressionUtil {
  private static readonly DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    outputFormat: 'image/jpeg',
  };

  /**
   * Compress an image file
   * @param file - The image file to compress
   * @param options - Compression options
   * @returns Promise<File> - Compressed file
   */
  static async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<File> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    // Validate input
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not an image');
    }

    // If file is already small enough, return as-is
    if (file.size < 100 * 1024) { // Less than 100KB
      return file;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions
          let { width, height } = img;
          const { maxWidth, maxHeight } = opts;

          if (maxWidth && width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          if (maxHeight && height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Create new File object
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '.jpg'),
                {
                  type: opts.outputFormat,
                  lastModified: Date.now(),
                }
              );

              resolve(compressedFile);
            },
            opts.outputFormat,
            opts.quality
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Compress multiple images
   * @param files - Array of image files to compress
   * @param options - Compression options
   * @returns Promise<File[]> - Array of compressed files
   */
  static async compressImages(
    files: File[],
    options: CompressionOptions = {}
  ): Promise<File[]> {
    const compressedFiles: File[] = [];

    for (const file of files) {
      try {
        const compressed = await this.compressImage(file, options);
        compressedFiles.push(compressed);
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
        // Keep original file if compression fails
        compressedFiles.push(file);
      }
    }

    return compressedFiles;
  }

  /**
   * Get image dimensions without loading the full file
   * @param file - Image file
   * @returns Promise<{width: number, height: number}>
   */
  static async getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Check if file is an image
   * @param file - File to check
   * @returns boolean
   */
  static isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Get human-readable file size
   * @param bytes - File size in bytes
   * @returns string - Formatted size (e.g., "1.5 MB")
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Estimate compression ratio
   * @param originalSize - Original file size in bytes
   * @param compressedSize - Compressed file size in bytes
   * @returns number - Compression ratio (0 to 1)
   */
  static getCompressionRatio(originalSize: number, compressedSize: number): number {
    return 1 - (compressedSize / originalSize);
  }
}
