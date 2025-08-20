import { getFileSize } from '../merge';
import * as fs from 'fs';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('getFileSize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return size in MB with 2 decimals', () => {
    mockedFs.statSync.mockReturnValue({ size: 1048576 } as any);

    const result = getFileSize('test.gpkg');

    expect(result).toBe('1.00');
  });

  test('should handle small files', () => {
    mockedFs.statSync.mockReturnValue({ size: 1024 } as any);

    const result = getFileSize('small.gpkg');

    expect(result).toBe('0.00');
  });

  test('should handle large files', () => {
    mockedFs.statSync.mockReturnValue({ size: 104857600 } as any);

    const result = getFileSize('large.gpkg');

    expect(result).toBe('100.00');
  });

  test('should format decimals correctly', () => {
    mockedFs.statSync.mockReturnValue({ size: 1572864 } as any);

    const result = getFileSize('test.gpkg');

    expect(result).toBe('1.50');
  });
});