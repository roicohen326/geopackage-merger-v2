describe('mergeTileData', () => {
  let originalMerge: any;
  
  beforeAll(() => {
    originalMerge = require('../merge');
  });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('should be a function', () => {
    const { mergeTileData } = require('../merge');
    expect(typeof mergeTileData).toBe('function');
  });

  test('should attach and detach database', () => {
    const mockSourceDb = { close: jest.fn() };
    
    jest.doMock('../merge', () => ({
      ...originalMerge,
      mergeTileData: originalMerge.mergeTileData,
      openDatabase: jest.fn(() => mockSourceDb),
      getDataTables: jest.fn(() => []),
      getTableColumns: jest.fn(() => [])
    }));

    const { mergeTileData } = require('../merge');
    const mockTargetDb = {
      exec: jest.fn(),
      prepare: jest.fn(() => ({ run: () => ({ changes: 0 }) }))
    };

    const result = mergeTileData(mockTargetDb, 'merged_tiles', 'source.gpkg', 'source', true);

    expect(mockTargetDb.exec).toHaveBeenCalledWith("ATTACH DATABASE 'source.gpkg' AS source_db");
    expect(mockTargetDb.exec).toHaveBeenCalledWith('DETACH DATABASE source_db');
    expect(mockSourceDb.close).toHaveBeenCalled();
    expect(result).toBe(0);
  });

  test('should use INSERT OR IGNORE strategy', () => {
    const mockSourceDb = { close: jest.fn() };
    
    jest.doMock('../merge', () => ({
      ...originalMerge,
      mergeTileData: originalMerge.mergeTileData,
      openDatabase: jest.fn(() => mockSourceDb),
      getDataTables: jest.fn(() => [{ name: 'tiles_table' }]),
      getTableColumns: jest.fn(() => [{ name: 'tile_data', type: 'BLOB' }])
    }));

    const { mergeTileData } = require('../merge');
    const mockTargetDb = {
      exec: jest.fn(),
      prepare: jest.fn(() => ({ run: () => ({ changes: 50 }) }))
    };

    const result = mergeTileData(mockTargetDb, 'merged_tiles', 'source.gpkg', 'source', true);

    expect(mockTargetDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR IGNORE')
    );
    expect(result).toBe(50);
  });

  test('should use INSERT OR REPLACE strategy', () => {
    const mockSourceDb = { close: jest.fn() };
    
    jest.doMock('../merge', () => ({
      ...originalMerge,
      mergeTileData: originalMerge.mergeTileData,
      openDatabase: jest.fn(() => mockSourceDb),
      getDataTables: jest.fn(() => [{ name: 'tiles_table' }]),
      getTableColumns: jest.fn(() => [{ name: 'tile_data', type: 'BLOB' }])
    }));

    const { mergeTileData } = require('../merge');
    const mockTargetDb = {
      exec: jest.fn(),
      prepare: jest.fn(() => ({ run: () => ({ changes: 75 }) }))
    };

    const result = mergeTileData(mockTargetDb, 'merged_tiles', 'source.gpkg', 'source', false);

    expect(mockTargetDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE')
    );
    expect(result).toBe(75);
  });

  test('should skip non-tile tables', () => {
    const mockSourceDb = { close: jest.fn() };
    
    jest.doMock('../merge', () => ({
      ...originalMerge,
      mergeTileData: originalMerge.mergeTileData,
      openDatabase: jest.fn(() => mockSourceDb),
      getDataTables: jest.fn(() => [{ name: 'features_table' }]),
      getTableColumns: jest.fn(() => [{ name: 'geometry', type: 'BLOB' }])
    }));

    const { mergeTileData } = require('../merge');
    const mockTargetDb = {
      exec: jest.fn(),
      prepare: jest.fn()
    };

    const result = mergeTileData(mockTargetDb, 'merged_tiles', 'source.gpkg', 'source', true);

    expect(mockTargetDb.prepare).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });
});
