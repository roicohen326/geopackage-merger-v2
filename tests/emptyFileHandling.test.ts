import { findTileTable, getDataTables } from '../merge';
const createMockDatabase = () => ({
 prepare: jest.fn().mockReturnValue({
   all: jest.fn()
 })
});
describe('Empty and Corrupt File Handling', () => {
 describe('findTileTable edge cases', () => {
   test('should return null for gpkg with no tile tables', () => {
     const mockDb = createMockDatabase();
     mockDb.prepare().all
       .mockReturnValueOnce([{ name: 'points' }, { name: 'polygons' }])
       .mockReturnValue([{ name: 'geom', type: 'BLOB', notnull: 1, dflt_value: null, pk: 0 }]);
     const result = findTileTable(mockDb as any);
     expect(result).toBeNull();
   });
   test('should handle empty database', () => {
     const mockDb = createMockDatabase();
     mockDb.prepare().all.mockReturnValue([]);
     const result = findTileTable(mockDb as any);
     expect(result).toBeNull();
   });
 });
 describe('getDataTables edge cases', () => {
   test('should handle database with only system tables', () => {
     const mockDb = createMockDatabase();
     mockDb.prepare().all.mockReturnValue([]);
     const result = getDataTables(mockDb as any);
     expect(result).toEqual([]);
   });
   test('should handle completely empty database', () => {
     const mockDb = createMockDatabase();
     mockDb.prepare().all.mockReturnValue([]);
     const result = getDataTables(mockDb as any);
     expect(result).toEqual([]);
   });
 });
});
