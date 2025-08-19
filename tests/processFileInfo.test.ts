import { processFileInfo } from '../merge';
import * as fs from 'fs';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('processFileInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return complete file info with priority true', () => {
    mockedFs.statSync.mockReturnValue({ size: 2097152 } as any);
    
    const result = processFileInfo('/path/to/data.gpkg', true);
    
    expect(result).toEqual({
      path: '/path/to/data.gpkg',
      name: 'data',
      size: '2.00',
      priority: true
    });
  });

  test('should return complete file info with priority false', () => {
    mockedFs.statSync.mockReturnValue({ size: 1048576 } as any);
    
    const result = processFileInfo('/path/to/backup.gpkg', false);
    
    expect(result).toEqual({
      path: '/path/to/backup.gpkg',
      name: 'backup',
      size: '1.00',
      priority: false
    });
  });

  test('should handle complex file paths', () => {
    mockedFs.statSync.mockReturnValue({ size: 5242880 } as any);
    
    const result = processFileInfo('/home/user/data/geo_2024.gpkg', true);
    
    expect(result).toEqual({
      path: '/home/user/data/geo_2024.gpkg',
      name: 'geo_2024',
      size: '5.00',
      priority: true
    });
  });
});
