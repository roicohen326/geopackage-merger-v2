import { createOutputFilename } from '../merge';
describe('createOutputFilename', () => {
 test('should return custom output when provided', () => {
   const result = createOutputFilename('file1.gpkg', 'file2.gpkg', 'custom.gpkg');
   expect(result).toBe('custom.gpkg');
 });
 test('should generate filename from input files', () => {
   const result = createOutputFilename('data1.gpkg', 'data2.gpkg');
   expect(result).toBe('merged_data1_data2.gpkg');
 });
 test('should handle complex names', () => {
   const result = createOutputFilename('geo_2024.gpkg', 'backup.gpkg');
   expect(result).toBe('merged_geo_2024_backup.gpkg');
 });
 test('should work with simple filenames', () => {
   const result = createOutputFilename('file1.gpkg', 'file2.gpkg');
   expect(result).toBe('merged_file1_file2.gpkg');
 });
});
