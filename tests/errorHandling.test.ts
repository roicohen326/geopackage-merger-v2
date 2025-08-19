import { openDatabase, getDataTables, getTableColumns } from '../merge';
import Database from 'better-sqlite3';
jest.mock('better-sqlite3');
const MockedDatabase = Database as jest.MockedClass<typeof Database>;
describe('Error Handling', () => {
 describe('openDatabase errors', () => {
   test('should throw for corrupt file', () => {
     MockedDatabase.mockImplementation(() => { throw new Error('file is not a database'); });
     expect(() => openDatabase('corrupt.gpkg')).toThrow('file is not a database');
   });
   test('should throw for missing file', () => {
     MockedDatabase.mockImplementation(() => { throw new Error('unable to open database file'); });
     expect(() => openDatabase('missing.gpkg')).toThrow('unable to open database file');
   });
 });
 describe('getDataTables errors', () => {
   test('should handle prepare failure', () => {
     const mockDb = { prepare: jest.fn().mockImplementation(() => { throw new Error('SQL error'); }) };
     expect(() => getDataTables(mockDb as any)).toThrow('SQL error');
   });
   test('should handle execution failure', () => {
     const mockDb = {
       prepare: jest.fn().mockReturnValue({
         all: jest.fn().mockImplementation(() => { throw new Error('malformed database'); })
       })
     };
     expect(() => getDataTables(mockDb as any)).toThrow('malformed database');
   });
 });
 describe('getTableColumns errors', () => {
   test('should handle invalid table name', () => {
     const mockDb = {
       prepare: jest.fn().mockReturnValue({
         all: jest.fn().mockImplementation(() => { throw new Error('no such table'); })
       })
     };
     expect(() => getTableColumns(mockDb as any, 'invalid')).toThrow('no such table');
   });
   test('should handle PRAGMA failure', () => {
     const mockDb = { prepare: jest.fn().mockImplementation(() => { throw new Error('PRAGMA failed'); }) };
     expect(() => getTableColumns(mockDb as any, 'test')).toThrow('PRAGMA failed');
   });
 });
});
