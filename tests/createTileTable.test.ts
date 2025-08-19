describe('createTileTable', () => {
  let originalMerge: any;
  
  beforeAll(() => {
    originalMerge = require('../merge');
  });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('should be a function', () => {
    const { createTileTable } = require('../merge');
    expect(typeof createTileTable).toBe('function');
  });

  test('should throw error when no tile tables found', () => {
    jest.doMock('../merge', () => ({
      ...originalMerge,
      createTileTable: originalMerge.createTileTable,
      openDatabase: jest.fn(() => ({ close: jest.fn() })),
      findTileTable: jest.fn(() => null),
      copyTileMetadata: jest.fn()
    }));

    const { createTileTable } = require('../merge');
    const mockTargetDb = { exec: jest.fn() };

    expect(() => {
      createTileTable(mockTargetDb, 'merged_tiles', 'file1.gpkg', 'file2.gpkg');
    }).toThrow('No tile tables found for metadata template');
  });

  test('should create table with correct schema', () => {
    jest.doMock('../merge', () => ({
      ...originalMerge,
      createTileTable: originalMerge.createTileTable,
      openDatabase: jest.fn(() => ({ close: jest.fn() })),
      findTileTable: jest.fn()
        .mockReturnValueOnce({ name: 'source_tiles' })
        .mockReturnValueOnce(null),
      copyTileMetadata: jest.fn()
    }));

    const { createTileTable } = require('../merge');
    const mockTargetDb = { exec: jest.fn() };

    createTileTable(mockTargetDb, 'merged_tiles', 'file1.gpkg', 'file2.gpkg');

    expect(mockTargetDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE "merged_tiles"')
    );
    expect(mockTargetDb.exec).toHaveBeenCalledWith(
      expect.stringContaining('tile_data BLOB NOT NULL')
    );
  });

  test('should close opened databases', () => {
    const mockDb1 = { close: jest.fn() };
    const mockDb2 = { close: jest.fn() };

    jest.doMock('../merge', () => ({
      ...originalMerge,
      createTileTable: originalMerge.createTileTable,
      openDatabase: jest.fn()
        .mockReturnValueOnce(mockDb1)
        .mockReturnValueOnce(mockDb2),
      findTileTable: jest.fn()
        .mockReturnValueOnce({ name: 'tiles' })
        .mockReturnValueOnce(null),
      copyTileMetadata: jest.fn()
    }));

    const { createTileTable } = require('../merge');
    const mockTargetDb = { exec: jest.fn() };

    createTileTable(mockTargetDb, 'merged_tiles', 'file1.gpkg', 'file2.gpkg');

    expect(mockDb1.close).toHaveBeenCalled();
    expect(mockDb2.close).toHaveBeenCalled();
  });
});
