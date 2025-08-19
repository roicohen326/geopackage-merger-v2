import { findTileTable } from '../merge';
const createMockDatabase = () => ({
 prepare: jest.fn().mockReturnValue({
   all: jest.fn()
 })
});
describe('findTileTable', () => {
 test('should return tile table when found', () => {
   const mockDb = createMockDatabase();
   mockDb.prepare().all
     .mockReturnValueOnce([{ name: 'regular_table' }, { name: 'tile_table' }])
     .mockReturnValueOnce([{ name: 'id', type: 'INTEGER' }])
     .mockReturnValueOnce([{ name: 'tile_data', type: 'BLOB' }]);
   const result = findTileTable(mockDb as any);
   expect(result).toEqual({ name: 'tile_table' });
 });
 test('should return null when no tile table found', () => {
   const mockDb = createMockDatabase();
   mockDb.prepare().all
     .mockReturnValueOnce([{ name: 'regular_table' }])
     .mockReturnValueOnce([{ name: 'id', type: 'INTEGER' }]);
   const result = findTileTable(mockDb as any);
   expect(result).toBeNull();
 });
 test('should return null when no tables exist', () => {
   const mockDb = createMockDatabase();
   mockDb.prepare().all.mockReturnValueOnce([]);
   const result = findTileTable(mockDb as any);
   expect(result).toBeNull();
 });
});
