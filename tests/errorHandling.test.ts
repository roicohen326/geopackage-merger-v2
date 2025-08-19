import { openDatabase, getDataTables, getTableColumns } from '../merge';
import Database from 'better-sqlite3';

// Mock better-sqlite3
jest.mock('better-sqlite3');
const MockedDatabase = Database as jest.MockedClass<typeof Database>;

describe('Error Handling Tests', () => {
  describe('openDatabase error scenarios', () => {
    test('should throw error for corrupt gpkg file', () => {
      MockedDatabase.mockImplementation(() => {
        throw new Error('file is not a database');
      });

      expect(() => {
        openDatabase('/path/corrupt.gpkg');
      }).toThrow('file is not a database');
    });

    test('should throw error for missing file', () => {
      MockedDatabase.mockImplementation(() => {
        throw new Error('unable to open database file');
      });

      expect(() => {
        openDatabase('/path/missing.gpkg');
      }).toThrow('unable to open database file');
    });
  });

  describe('getDataTables error scenarios', () => {
    test('should handle database prepare failure', () => {
      const mockDb = {
        prepare: jest.fn().mockImplementation(() => {
          throw new Error('SQL error: no such table');
        })
      };

      expect(() => {
        getDataTables(mockDb as any);
      }).toThrow('SQL error: no such table');
    });

    test('should handle SQL execution failure', () => {
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockImplementation(() => {
            throw new Error('database disk image is malformed');
          })
        })
      };

      expect(() => {
        getDataTables(mockDb as any);
      }).toThrow('database disk image is malformed');
    });
  });

  describe('getTableColumns error scenarios', () => {
    test('should handle invalid table name', () => {
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockImplementation(() => {
            throw new Error('no such table: invalid_table');
          })
        })
      };

      expect(() => {
        getTableColumns(mockDb as any, 'invalid_table');
      }).toThrow('no such table: invalid_table');
    });

    test('should handle PRAGMA failure', () => {
      const mockDb = {
        prepare: jest.fn().mockImplementation(() => {
          throw new Error('PRAGMA table_info failed');
        })
      };

      expect(() => {
        getTableColumns(mockDb as any, 'test_table');
      }).toThrow('PRAGMA table_info failed');
    });
  });
});
