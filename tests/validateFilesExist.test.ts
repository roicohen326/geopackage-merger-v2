import { validateFilesExist } from '../merge';
import * as fs from 'fs';
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;
describe('validateFilesExist', () => {
 beforeEach(() => { jest.clearAllMocks(); });
 test('should not throw when both files exist', () => {
   mockedFs.existsSync.mockReturnValue(true);
   expect(() => {
     validateFilesExist('source1.gpkg', 'source2.gpkg');
   }).not.toThrow();
 });
 test('should throw when first file missing', () => {
   mockedFs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
   expect(() => {
     validateFilesExist('missing.gpkg', 'source2.gpkg');
   }).toThrow('Missing file(s): missing.gpkg');
 });
 test('should throw when second file missing', () => {
   mockedFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
   expect(() => {
     validateFilesExist('source1.gpkg', 'missing.gpkg');
   }).toThrow('Missing file(s): missing.gpkg');
 });
 test('should throw when both files missing', () => {
   mockedFs.existsSync.mockReturnValue(false);
   expect(() => {
     validateFilesExist('missing1.gpkg', 'missing2.gpkg');
   }).toThrow('Missing file(s): missing1.gpkg, missing2.gpkg');
 });
 test('should handle cross-platform paths', () => {
   mockedFs.existsSync.mockReturnValue(true);
   expect(() => {
     validateFilesExist('C:\\Windows\\file1.gpkg', '/unix/file2.gpkg');
   }).not.toThrow();
 });
});
