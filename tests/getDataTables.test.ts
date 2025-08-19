import { getDataTables } from '../merge';
const createMockDatabase = () => ({
 prepare: jest.fn().mockReturnValue({
   all: jest.fn()
 })
});
describe('getDataTables', () => {
 test('should return data tables excluding system tables', () => {
   const mockDb = createMockDatabase();
   mockDb.prepare().all.mockReturnValue([{ name: 'user_data' }, { name: 'tiles' }]);
   const result = getDataTables(mockDb as any);
   expect(result).toEqual([{ name: 'user_data' }, { name: 'tiles' }]);
 });
 test('should return empty array when no data tables', () => {
   const mockDb = createMockDatabase();
   mockDb.prepare().all.mockReturnValue([]);
   const result = getDataTables(mockDb as any);
   expect(result).toEqual([]);
 });
 test('should filter system tables correctly', () => {
   const mockDb = createMockDatabase();
   mockDb.prepare().all.mockReturnValue([{ name: 'user_table' }]);
   const result = getDataTables(mockDb as any);
   expect(result).toEqual([{ name: 'user_table' }]);
 });
});
