import { getDataTables } from '../merge';

describe('getDataTables', () => {
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

  test('should return data tables excluding system tables', () => {
    mockStatement.all.mockReturnValue([
      { name: 'user_data' },
      { name: 'tiles' },
      { name: 'geographic_features' }
    ]);
    
    const result = getDataTables(mockDatabase);
    
    expect(result).toEqual([
      { name: 'user_data' },
      { name: 'tiles' },
      { name: 'geographic_features' }
    ]);
    
    expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining(
      "SELECT name FROM sqlite_master"
    ));
    expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining(
      "AND name NOT LIKE 'sqlite_%'"
    ));
  });

  test('should return empty array when no data tables exist', () => {
    mockStatement.all.mockReturnValue([]);
    
    const result = getDataTables(mockDatabase);
    
    expect(result).toEqual([]);
    expect(mockStatement.all).toHaveBeenCalled();
  });

  test('should filter out system and metadata tables', () => {
    mockStatement.all.mockReturnValue([
      { name: 'user_table' },
      { name: 'my_tiles' }
    ]);
    
    const result = getDataTables(mockDatabase);
    
    // Verify the SQL excludes system tables
    const calledSQL = mockPrepare.mock.calls[0][0];
    expect(calledSQL).toMatch(/NOT LIKE 'sqlite_%'/);
    expect(calledSQL).toMatch(/NOT LIKE 'gpkg_%'/);
    expect(calledSQL).toMatch(/NOT LIKE 'rtree_%'/);
    expect(calledSQL).toMatch(/NOT LIKE 'idx_%'/);
    
    expect(result).toEqual([
      { name: 'user_table' },
      { name: 'my_tiles' }
    ]);
  });
});
