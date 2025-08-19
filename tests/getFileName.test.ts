import { getFileName } from '../merge';

describe('getFileName', () => {
  test('should extract filename without extension', () => {
    const filepath = '/path/to/file.gpkg';
    const result = getFileName(filepath);
    expect(result).toBe('file');
  });

  test('should handle files with multiple dots', () => {
    const filepath = '/path/file.backup.gpkg';
    const result = getFileName(filepath);
    expect(result).toBe('file.backup');
  });

  test('should handle files without extension', () => {
    const filepath = '/path/to/file';
    const result = getFileName(filepath);
    expect(result).toBe('file');
  });

  test('should handle just filename with extension', () => {
    const filepath = 'myfile.gpkg';
    const result = getFileName(filepath);
    expect(result).toBe('myfile');
  });

  test('should handle empty extension', () => {
    const filepath = '/path/to/file.';
    const result = getFileName(filepath);
    expect(result).toBe('file');
  });

  test('should handle complex paths', () => {
    const filepath = '/home/user/projects/data/geographic_data_2024.gpkg';
    const result = getFileName(filepath);
    expect(result).toBe('geographic_data_2024');
  });

  test('should handle files with no path', () => {
    const filepath = 'standalone.gpkg';
    const result = getFileName(filepath);
    expect(result).toBe('standalone');
  });
});