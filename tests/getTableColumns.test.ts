import { getTableColumns } from '../merge';

describe('getTableColumns', () => {
  test('should return table column information', () => {
    const mockColumns = [
      { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
      { name: 'tile_data', type: 'BLOB', notnull: 1, dflt_value: null, pk: 0 }
    ];
    const mockDb = {
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue(mockColumns)
      })
    };

    const result = getTableColumns(mockDb as any, 'test_table');

    expect(result).toEqual(mockColumns);
  });

  test('should return empty array for empty table', () => {
    const mockDb = {
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([])
      })
    };

    const result = getTableColumns(mockDb as any, 'empty_table');

    expect(result).toEqual([]);
  });

  test('should call PRAGMA table_info with correct table name', () => {
    const mockDb = {
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([])
      })
    };

    getTableColumns(mockDb as any, 'test_table');

    expect(mockDb.prepare).toHaveBeenCalledWith('PRAGMA table_info("test_table")');
  });

  test('should handle special table names', () => {
    const mockDb = {
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([{ name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 }])
      })
    };

    const result = getTableColumns(mockDb as any, 'table-with-dashes');

    expect(mockDb.prepare).toHaveBeenCalledWith('PRAGMA table_info("table-with-dashes")');
    expect(result).toHaveLength(1);
  });

  test('should handle various column types', () => {
    const complexColumns = [
      { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
      { name: 'name', type: 'TEXT', notnull: 0, dflt_value: 'default', pk: 0 },
      { name: 'tile_data', type: 'BLOB', notnull: 1, dflt_value: null, pk: 0 },
      { name: 'created', type: 'DATETIME', notnull: 0, dflt_value: 'CURRENT_TIMESTAMP', pk: 0 }
    ];
    const mockDb = {
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue(complexColumns)
      })
    };

    const result = getTableColumns(mockDb as any, 'complex_table');

    expect(result).toHaveLength(4);
    expect(result[0].pk).toBe(1);
    expect(result[1].dflt_value).toBe('default');
  });
});