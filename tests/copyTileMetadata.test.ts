import { copyTileMetadata } from '../merge';

describe('copyTileMetadata', () => {
  test('should be a function', () => {
    expect(typeof copyTileMetadata).toBe('function');
  });

  test('should throw when source metadata is missing', () => {
    const mockSourceDb = {
      prepare: jest.fn().mockReturnValue({
        get: jest.fn().mockReturnValue(null)
      })
    };
    const mockTargetDb = {
      prepare: jest.fn().mockReturnValue({
        run: jest.fn()
      })
    };

    expect(() => {
      copyTileMetadata(mockSourceDb as any, mockTargetDb as any, 'missing', 'target');
    }).toThrow('No gpkg_contents entry found for table: missing');
  });

  test('should handle valid metadata transfer', () => {
    const mockSourceDb = {
      prepare: jest.fn().mockReturnValue({
        get: jest.fn()
          .mockReturnValueOnce({ data_type: 'tiles', srs_id: 4326, min_x: 0, min_y: 0, max_x: 1, max_y: 1 })
          .mockReturnValueOnce({ srs_id: 4326, min_x: 0, min_y: 0, max_x: 1, max_y: 1 }),
        all: jest.fn().mockReturnValue([{ zoom_level: 0, matrix_width: 1, matrix_height: 1, tile_width: 256, tile_height: 256, pixel_x_size: 1, pixel_y_size: 1 }])
      })
    };
    const mockTargetDb = {
      prepare: jest.fn().mockReturnValue({
        run: jest.fn()
      })
    };

    expect(() => {
      copyTileMetadata(mockSourceDb as any, mockTargetDb as any, 'source', 'target');
    }).not.toThrow();
  });
});