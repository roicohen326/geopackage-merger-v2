import { createOutputFilename } from '../merge';

describe('createOutputFilename', () => {
  test('should return custom output when provided', () => {
    const result = createOutputFilename('/path/file1.gpkg', '/path/file2.gpkg', 'custom.gpkg');
    
    expect(result).toBe('custom.gpkg');
  });

  test('should generate filename from two input files', () => {
    const result = createOutputFilename('/path/data1.gpkg', '/path/data2.gpkg');
    
    expect(result).toBe('merged_data1_data2.gpkg');
  });

  test('should handle files with complex names', () => {
    const result = createOutputFilename('/path/geographic_data_2024.gpkg', '/path/backup_tiles.gpkg');
    
    expect(result).toBe('merged_geographic_data_2024_backup_tiles.gpkg');
  });

  test('should work with just filenames', () => {
    const result = createOutputFilename('file1.gpkg', 'file2.gpkg');
    
    expect(result).toBe('merged_file1_file2.gpkg');
  });
});
