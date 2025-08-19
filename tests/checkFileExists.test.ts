import { checkFileExists } from '../merge';
import * as fs from 'fs';
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;
describe('checkFileExists', () => {
 beforeEach(() => { jest.clearAllMocks(); });
 test('should return true when file exists', () => {
   mockedFs.existsSync.mockReturnValue(true);
   const result = checkFileExists('test.gpkg');
   expect(result).toBe(true);
 });
 test('should return false when file does not exist', () => {
   mockedFs.existsSync.mockReturnValue(false);
   const result = checkFileExists('missing.gpkg');
   expect(result).toBe(false);
 });
 test('should handle complex paths', () => {
   mockedFs.existsSync.mockReturnValue(true);
   const result = checkFileExists('/path/file.gpkg');
   expect(result).toBe(true);
 });
});
