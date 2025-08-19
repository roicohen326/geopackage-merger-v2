import { findTileTable } from '../merge';

// Create a mock database with a prepare method
const createMockDatabase = () => ({
  prepare: jest.fn().mockReturnValue({
    all: jest.fn()
  })
});

describe('findTileTable', () => {
  test('should return tile table when found', () => {
    const mockDb = createMockDatabase();
    
    // Mock the SQL responses
    mockDb.prepare().all
      .mockReturnValueOnce([{ name: 'regular_table' }, { name: 'tile_table' }])  // getDataTables
      .mockReturnValueOnce([{ name: 'id', type: 'INTEGER' }])                     // getTableColumns for 'regular_table'
      .mockReturnValueOnce([{ name: 'tile_data', type: 'BLOB' }]);               // getTableColumns for 'tile_table'
    
    const result = findTileTable(mockDb as any);
    expect(result).toEqual({ name: 'tile_table' });
  });

  test('should return null when no tile table found', () => {
    const mockDb = createMockDatabase();
    
    mockDb.prepare().all
      .mockReturnValueOnce([{ name: 'regular_table' }])     // getDataTables
      .mockReturnValueOnce([{ name: 'id', type: 'INTEGER' }]); // getTableColumns
    
    const result = findTileTable(mockDb as any);
    expect(result).toBeNull();
  });

  test('should return null when no tables exist', () => {
    const mockDb = createMockDatabase();
    
    mockDb.prepare().all.mockReturnValueOnce([]); // getDataTables returns empty
    
    const result = findTileTable(mockDb as any);
    expect(result).toBeNull();
  });
});
