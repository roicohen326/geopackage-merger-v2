import { checkFileExists } from '../merge';
import * as fs from 'fs';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('checkFileExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return true when file exists', () => {
    mockedFs.existsSync.mockReturnValue(true);
    
    const result = checkFileExists('/path/to/file.gpkg');
    
    expect(result).toBe(true);
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/path/to/file.gpkg');
  });

  test('should return false when file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    
    const result = checkFileExists('/path/to/missing.gpkg');
    
    expect(result).toBe(false);
  });

  test('should handle different file paths', () => {
    mockedFs.existsSync.mockReturnValue(true);
    
    const result = checkFileExists('/home/user/data/file.gpkg');
    
    expect(result).toBe(true);
  });
});
