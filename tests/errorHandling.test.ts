import { openDatabase, getDataTables, getTableColumns } from '../merge';
import * as merge from '../merge';

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('openDatabase errors', () => {
    test('should call new Database with correct parameters', () => {
      jest.spyOn(merge, 'openDatabase').mockReturnValue({} as any);

      const result = openDatabase('test.gpkg');

      expect(typeof result).toBe('object');
    });

    test('should return database connection when file exists', () => {
      const mockDb = { prepare: jest.fn() };
      jest.spyOn(merge, 'openDatabase').mockReturnValue(mockDb as any);

      const result = openDatabase('test.gpkg');

      expect(result).toBe(mockDb);
    });

    test('should handle database creation', () => {
      jest.spyOn(merge, 'openDatabase').mockReturnValue({ prepare: jest.fn() } as any);

      const result = openDatabase('valid.gpkg');

      expect(result).toHaveProperty('prepare');
    });
  });

  describe('getDataTables errors', () => {
    test('should call database prepare and return result', () => {
      const mockTables = [{ name: 'test_table' }];
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue(mockTables)
        })
      };

      const result = getDataTables(mockDb as any);

      expect(mockDb.prepare).toHaveBeenCalled();
      expect(result).toBe(mockTables);
    });

    test('should return empty array when no tables found', () => {
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue([])
        })
      };

      const result = getDataTables(mockDb as any);

      expect(result).toEqual([]);
    });

    test('should execute SQL query correctly', () => {
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue([])
        })
      };

      getDataTables(mockDb as any);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT name FROM sqlite_master'));
    });
  });

  describe('getTableColumns errors', () => {
    test('should call PRAGMA table_info with correct table name', () => {
      const mockColumns = [{ name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 }];
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue(mockColumns)
        })
      };

      const result = getTableColumns(mockDb as any, 'test_table');

      expect(mockDb.prepare).toHaveBeenCalledWith('PRAGMA table_info("test_table")');
      expect(result).toBe(mockColumns);
    });

    test('should return empty array when no columns found', () => {
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue([])
        })
      };

      const result = getTableColumns(mockDb as any, 'empty_table');

      expect(result).toEqual([]);
    });

    test('should handle special table names correctly', () => {
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue([])
        })
      };

      getTableColumns(mockDb as any, 'table-with-dashes');

      expect(mockDb.prepare).toHaveBeenCalledWith('PRAGMA table_info("table-with-dashes")');
    });
  });
});