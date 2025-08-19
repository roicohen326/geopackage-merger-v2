import { getTableColumns } from '../merge';
const createMockDatabase = () => ({
 prepare: jest.fn().mockReturnValue({
   all: jest.fn()
 })
});
describe('getTableColumns', () => {
 test('should return table column information', () => {
   const mockDb = createMockDatabase();
   const mockColumns = [
     { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
     { name: 'tile_data', type: 'BLOB', notnull: 1, dflt_value: null, pk: 0 }
   ];
   mockDb.prepare().all.mockReturnValue(mockColumns);
   const result = getTableColumns(mockDb as any, 'test_table');
   expect(result).toEqual(mockColumns);
 });
 test('should return empty array for empty table', () => {
   const mockDb = createMockDatabase();
   mockDb.prepare().all.mockReturnValue([]);
   const result = getTableColumns(mockDb as any, 'empty_table');
   expect(result).toEqual([]);
 });
 test('should handle special table names', () => {
   const mockDb = createMockDatabase();
   mockDb.prepare().all.mockReturnValue([{ name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 }]);
   const result = getTableColumns(mockDb as any, 'table-with-dashes');
   expect(result).toHaveLength(1);
 });
 test('should handle various column types', () => {
   const mockDb = createMockDatabase();
   const complexColumns = [
     { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
     { name: 'name', type: 'TEXT', notnull: 0, dflt_value: 'default', pk: 0 },
     { name: 'tile_data', type: 'BLOB', notnull: 1, dflt_value: null, pk: 0 },
     { name: 'created', type: 'DATETIME', notnull: 0, dflt_value: 'CURRENT_TIMESTAMP', pk: 0 }
   ];
   mockDb.prepare().all.mockReturnValue(complexColumns);
   const result = getTableColumns(mockDb as any, 'complex_table');
   expect(result).toHaveLength(4);
   expect(result[0].pk).toBe(1);
   expect(result[1].dflt_value).toBe('default');
 });
});
