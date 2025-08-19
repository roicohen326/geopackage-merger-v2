import { findTileTable, getDataTables } from '../merge';

describe('Empty and Corrupt File Handling', () => {
  describe('findTileTable with edge cases', () => {
    test('should return null for valid gpkg with no tile tables', () => {
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn()
            .mockReturnValueOnce([{ name: 'points' }, { name: 'polygons' }]) // getDataTables
            .mockReturnValue([{ name: 'geom', type: 'BLOB', notnull: 1, dflt_value: null, pk: 0 }]) // getTableColumns - no tile_data
        })
      };

      const result = findTileTable(mockDb as any);
      expect(result).toBeNull();
    });

    test('should handle empty database', () => {
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue([]) // No tables at all
        })
      };

      const result = findTileTable(mockDb as any);
      expect(result).toBeNull();
    });
  });

  describe('getDataTables with edge cases', () => {
    test('should handle database with only system tables', () => {
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue([]) // System tables filtered out
        })
      };

      const result = getDataTables(mockDb as any);
      expect(result).toEqual([]);
    });

    test('should handle completely empty database', () => {
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          all: jest.fn().mockReturnValue([])
        })
      };

      const result = getDataTables(mockDb as any);
      expect(result).toEqual([]);
    });
  });
});
