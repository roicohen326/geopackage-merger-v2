import { ensureUniqueOutputFile } from '../merge';
import * as fs from 'fs';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ensureUniqueOutputFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return original filename when file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    
    const result = ensureUniqueOutputFile('/path/output.gpkg');
    
    expect(result).toBe('/path/output.gpkg');
  });

  test('should generate unique filename when file exists', () => {
    mockedFs.existsSync.mockReturnValue(true);
    
    const result = ensureUniqueOutputFile('/path/output.gpkg');
    
    expect(result).toBe('/path/output_1234567890.gpkg');
    expect(console.log).toHaveBeenCalledWith('Output file exists, creating: /path/output_1234567890.gpkg');
  });

  test('should handle files without extension', () => {
    mockedFs.existsSync.mockReturnValue(true);
    
    const result = ensureUniqueOutputFile('/path/output');
    
    expect(result).toBe('/path/output_1234567890');
  });
});
