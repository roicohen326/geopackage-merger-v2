import { getTableColumns } from '../merge';

describe('getTableColumns', () => {
  let mockDatabase: any;
  let mockPrepare: jest.Mock;
  let mockStatement: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockStatement = {
      all: jest.fn(),
    };
    
    mockPrepare = jest.fn().mockReturnValue(mockStatement);
    
    mockDatabase = {
      prepare: mockPrepare,
    };
  });

  test('should return table column information', () => {
    const mockColumns = [
      { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
      { name: 'tile_data', type: 'BLOB', notnull: 1, dflt_value: null, pk: 0 },
      { name: 'zoom_level', type: 'INTEGER', notnull: 0, dflt_value: null, pk: 0 }
    ];
    
    mockStatement.all.mockReturnValue(mockColumns);
    
    const result = getTableColumns(mockDatabase, 'test_table');
    
    expect(result).toEqual(mockColumns);
    expect(mockPrepare).toHaveBeenCalledWith('PRAGMA table_info("test_table")');
    expect(mockStatement.all).toHaveBeenCalled();
  });

  test('should return empty array for table with no columns', () => {
    mockStatement.all.mockReturnValue([]);
    
    const result = getTableColumns(mockDatabase, 'empty_table');
    
    expect(result).toEqual([]);
    expect(mockPrepare).toHaveBeenCalledWith('PRAGMA table_info("empty_table")');
  });

  test('should handle table names with special characters', () => {
    mockStatement.all.mockReturnValue([
      { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 }
    ]);
    
    const result = getTableColumns(mockDatabase, 'table-with-dashes');
    
    expect(mockPrepare).toHaveBeenCalledWith('PRAGMA table_info("table-with-dashes")');
    expect(result).toHaveLength(1);
  });

  test('should handle tables with various column types', () => {
    const mockColumns = [
      { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
      { name: 'name', type: 'TEXT', notnull: 0, dflt_value: 'default', pk: 0 },
      { name: 'data', type: 'BLOB', notnull: 1, dflt_value: null, pk: 0 },
      { name: 'created', type: 'DATETIME', notnull: 0, dflt_value: 'CURRENT_TIMESTAMP', pk: 0 }
    ];
    
    mockStatement.all.mockReturnValue(mockColumns);
    
    const result = getTableColumns(mockDatabase, 'complex_table');
    
    expect(result).toEqual(mockColumns);
    expect(result).toHaveLength(4);
    expect(result[0].pk).toBe(1); // Primary key
    expect(result[1].dflt_value).toBe('default'); // Default value
    expect(result[3].type).toBe('DATETIME'); // DateTime type
  });
});
