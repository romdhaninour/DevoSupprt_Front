import { ImageCompressionUtil } from './image-compression.util';

describe('ImageCompressionUtil', () => {
  describe('isImage', () => {
    it('should return true for image files', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      expect(ImageCompressionUtil.isImage(file)).toBe(true);
    });

    it('should return true for JPEG', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(ImageCompressionUtil.isImage(file)).toBe(true);
    });

    it('should return true for GIF', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      expect(ImageCompressionUtil.isImage(file)).toBe(true);
    });

    it('should return false for text files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(ImageCompressionUtil.isImage(file)).toBe(false);
    });

    it('should return false for PDF files', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(ImageCompressionUtil.isImage(file)).toBe(false);
    });

    it('should return false for empty type', () => {
      const file = new File([''], 'test', { type: '' });
      expect(ImageCompressionUtil.isImage(file)).toBe(false);
    });

    it('should return false for video files', () => {
      const file = new File([''], 'test.mp4', { type: 'video/mp4' });
      expect(ImageCompressionUtil.isImage(file)).toBe(false);
    });

    it('should return true for webp images', () => {
      const file = new File([''], 'test.webp', { type: 'image/webp' });
      expect(ImageCompressionUtil.isImage(file)).toBe(true);
    });
  });

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(ImageCompressionUtil.formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(ImageCompressionUtil.formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      const result = ImageCompressionUtil.formatFileSize(1024);
      expect(result).toBe('1 KB');
    });

    it('should format megabytes', () => {
      const result = ImageCompressionUtil.formatFileSize(1048576);
      expect(result).toBe('1 MB');
    });

    it('should format gigabytes', () => {
      const result = ImageCompressionUtil.formatFileSize(1073741824);
      expect(result).toBe('1 GB');
    });

    it('should format fractional values', () => {
      const result = ImageCompressionUtil.formatFileSize(1536);
      expect(result).toBe('1.5 KB');
    });

    it('should format large byte value under 1KB', () => {
      const result = ImageCompressionUtil.formatFileSize(999);
      expect(result).toBe('999 Bytes');
    });

    it('should format 1024 bytes as 1 KB', () => {
      const result = ImageCompressionUtil.formatFileSize(1024);
      expect(result).toBe('1 KB');
    });
  });

  describe('getCompressionRatio', () => {
    it('should calculate compression ratio', () => {
      const ratio = ImageCompressionUtil.getCompressionRatio(1000, 500);
      expect(ratio).toBe(0.5);
    });

    it('should return 0 when no compression', () => {
      const ratio = ImageCompressionUtil.getCompressionRatio(1000, 1000);
      expect(ratio).toBe(0);
    });

    it('should handle full compression', () => {
      const ratio = ImageCompressionUtil.getCompressionRatio(1000, 0);
      expect(ratio).toBe(1);
    });

    it('should handle partial compression', () => {
      const ratio = ImageCompressionUtil.getCompressionRatio(1000, 250);
      expect(ratio).toBe(0.75);
    });
  });

  describe('compressImage', () => {
    it('should return original file if smaller than 100KB', async () => {
      const smallFile = new File(['a'.repeat(1000)], 'small.png', { type: 'image/png' });
      const result = await ImageCompressionUtil.compressImage(smallFile);
      expect(result).toBe(smallFile);
    });

    it('should throw error for non-image file', async () => {
      const nonImageFile = new File(['content'], 'file.txt', { type: 'text/plain' });
      try {
        await ImageCompressionUtil.compressImage(nonImageFile);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBe('File is not an image');
      }
    });

    it('should accept custom options', async () => {
      const smallFile = new File(['a'.repeat(500)], 'small.jpg', { type: 'image/jpeg' });
      const result = await ImageCompressionUtil.compressImage(smallFile, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.5,
      });
      expect(result).toBe(smallFile);
    });
  });

  describe('compressImages', () => {
    it('should return array of files for small images', async () => {
      const files = [
        new File(['a'.repeat(500)], 'small1.png', { type: 'image/png' }),
        new File(['b'.repeat(600)], 'small2.jpg', { type: 'image/jpeg' }),
      ];
      const result = await ImageCompressionUtil.compressImages(files);
      expect(result.length).toBe(2);
    });

    it('should return empty array for empty input', async () => {
      const result = await ImageCompressionUtil.compressImages([]);
      expect(result.length).toBe(0);
    });
  });

  describe('getImageDimensions', () => {
    it('should throw error for non-image file', async () => {
      const nonImageFile = new File(['content'], 'file.txt', { type: 'text/plain' });
      try {
        await ImageCompressionUtil.getImageDimensions(nonImageFile);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });
  });
});
