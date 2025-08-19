import { getFileSize } from '../merge';
import * as fs from 'fs';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('getFileSize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return file size in MB with 2 decimal places', () => {
    mockedFs.statSync.mockReturnValue({ size: 1048576 } as any);
    
    const result = getFileSize('/path/to/file.gpkg');
    
    expect(result).toBe('1.00');
    expect(mockedFs.statSync).toHaveBeenCalledWith('/path/to/file.gpkg');
  });

  test('should handle small files', () => {
    mockedFs.statSync.mockReturnValue({ size: 1024 } as any);
    
    const result = getFileSize('/path/to/small.gpkg');
    
    expect(result).toBe('0.00');
  });

  test('should handle large files', () => {
    mockedFs.statSync.mockReturnValue({ size: 104857600 } as any);
    
    const result = getFileSize('/path/to/large.gpkg');
    
    expect(result).toBe('100.00');
  });

  test('should format decimal places correctly', () => {
    mockedFs.statSync.mockReturnValue({ size: 1572864 } as any);
    
    const result = getFileSize('/path/to/file.gpkg');
    
    expect(result).toBe('1.50');
  });
});
