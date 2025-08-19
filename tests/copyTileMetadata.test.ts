const { copyTileMetadata } = require('../merge');

describe('copyTileMetadata', () => {
  test('should be a function', () => {
    expect(typeof copyTileMetadata).toBe('function');
  });

  test('should throw when source metadata is missing', () => {
    const mockSourceDb = {
      prepare: () => ({
        get: () => null
      })
    };
    const mockTargetDb = {
      prepare: () => ({
        run: () => {}
      })
    };

    expect(() => {
      copyTileMetadata(mockSourceDb, mockTargetDb, 'missing', 'target');
    }).toThrow();
  });

  test('should handle valid metadata transfer', () => {
    const mockSourceDb = {
      prepare: () => ({
        get: jest.fn()
          .mockReturnValueOnce({ data_type: 'tiles', srs_id: 4326 })
          .mockReturnValueOnce({ srs_id: 4326 }),
        all: () => [{ zoom_level: 0 }]
      })
    };
    const mockTargetDb = {
      prepare: () => ({
        run: () => {}
      })
    };

    expect(() => {
      copyTileMetadata(mockSourceDb, mockTargetDb, 'source', 'target');
    }).not.toThrow();
  });
});
