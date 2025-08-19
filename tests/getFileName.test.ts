import { getFileName } from '../merge';
describe('getFileName', () => {
 test('should extract filename without extension', () => {
   expect(getFileName('/path/to/file.gpkg')).toBe('file');
 });
 test('should handle multiple dots', () => {
   expect(getFileName('/path/file.backup.gpkg')).toBe('file.backup');
 });
 test('should handle no extension', () => {
   expect(getFileName('/path/to/file')).toBe('file');
 });
 test('should handle filename only', () => {
   expect(getFileName('myfile.gpkg')).toBe('myfile');
 });
 test('should handle empty extension', () => {
   expect(getFileName('/path/to/file.')).toBe('file');
 });
 test('should handle complex paths', () => {
   expect(getFileName('/home/user/projects/geographic_data_2024.gpkg')).toBe('geographic_data_2024');
 });
 test('should handle standalone filenames', () => {
   expect(getFileName('standalone.gpkg')).toBe('standalone');
 });
});
