import { validateFilesExist, checkFileExists } from '../merge';
import * as fs from 'fs';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('validateFilesExist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should not throw when both files exist', () => {
    mockedFs.existsSync.mockReturnValue(true);
    
    expect(() => {
      validateFilesExist('/path/to/file1.gpkg', '/path/to/file2.gpkg');
    }).not.toThrow();
    
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/path/to/file1.gpkg');
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/path/to/file2.gpkg');
  });

  test('should throw error when first file is missing', () => {
    mockedFs.existsSync
      .mockReturnValueOnce(false) // first file missing
      .mockReturnValueOnce(true);  // second file exists
    
    expect(() => {
      validateFilesExist('/path/to/missing1.gpkg', '/path/to/file2.gpkg');
    }).toThrow('Missing file(s): /path/to/missing1.gpkg');
  });

  test('should throw error when second file is missing', () => {
    mockedFs.existsSync
      .mockReturnValueOnce(true)   // first file exists
      .mockReturnValueOnce(false); // second file missing
    
    expect(() => {
      validateFilesExist('/path/to/file1.gpkg', '/path/to/missing2.gpkg');
    }).toThrow('Missing file(s): /path/to/missing2.gpkg');
  });

  test('should throw error when both files are missing', () => {
    mockedFs.existsSync.mockReturnValue(false);
    
    expect(() => {
      validateFilesExist('/path/to/missing1.gpkg', '/path/to/missing2.gpkg');
    }).toThrow('Missing file(s): /path/to/missing1.gpkg, /path/to/missing2.gpkg');
  });

  test('should handle different file paths', () => {
    mockedFs.existsSync.mockReturnValue(true);
    
    expect(() => {
      validateFilesExist('C:\\Windows\\path\\file1.gpkg', '/unix/path/file2.gpkg');
    }).not.toThrow();
    
    expect(mockedFs.existsSync).toHaveBeenCalledWith('C:\\Windows\\path\\file1.gpkg');
    expect(mockedFs.existsSync).toHaveBeenCalledWith('/unix/path/file2.gpkg');
  });
});
