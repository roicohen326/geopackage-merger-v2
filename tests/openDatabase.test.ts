import { openDatabase } from '../merge';
import Database from 'better-sqlite3';
jest.mock('better-sqlite3');
const MockedDatabase = Database as jest.MockedClass<typeof Database>;
describe('openDatabase', () => {
 beforeEach(() => { jest.clearAllMocks(); });
 test('should open database with readonly option', () => {
   const mockDb = {} as Database.Database;
   MockedDatabase.mockReturnValue(mockDb);
   const result = openDatabase('test.gpkg');
   expect(MockedDatabase).toHaveBeenCalledWith('test.gpkg', { readonly: true });
   expect(result).toBe(mockDb);
 });
 test('should handle different paths', () => {
   const mockDb = {} as Database.Database;
   MockedDatabase.mockReturnValue(mockDb);
   const result = openDatabase('/complex/path/file.gpkg');
   expect(MockedDatabase).toHaveBeenCalledWith('/complex/path/file.gpkg', { readonly: true });
   expect(result).toBe(mockDb);
 });
 test('should return database instance', () => {
   const mockDb = { prepare: jest.fn() } as unknown as Database.Database;
   MockedDatabase.mockReturnValue(mockDb);
   const result = openDatabase('test.gpkg');
   expect(result).toBe(mockDb);
   expect(result).toHaveProperty('prepare');
 });
});
