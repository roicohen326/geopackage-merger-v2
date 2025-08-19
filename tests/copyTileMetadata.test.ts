import path from 'path';
import { copyTileMetadata } from '../merge';

describe('copyTileMetadata', () => {
  let mockSourceDb: any;
  let mockTargetDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSourceDb = {
      prepare: jest.fn().mockReturnValue({
        get: jest.fn(),
        all: jest.fn()
      })
    };
    
    mockTargetDb = {
      prepare: jest.fn().mockReturnValue({
        run: jest.fn()
      })
    };
  });

  test('should copy complete metadata successfully', () => {
    mockSourceDb.prepare().get.mockReturnValueOnce({
      data_type: 'tiles',
      min_x: -180, min_y: -90, max_x: 180, max_y: 90,
      srs_id: 4326
    });
    
    mockSourceDb.prepare().get.mockReturnValueOnce({
      srs_id: 4326,
      min_x: -180, min_y: -90, max_x: 180, max_y: 90
    });
    
    mockSourceDb.prepare().all.mockReturnValueOnce([
      { zoom_level: 0, matrix_width: 1, matrix_height: 1, tile_width: 256, tile_height: 256 }
    ]);

    expect(() => {
      copyTileMetadata(mockSourceDb, mockTargetDb, 'source_tiles', 'target_tiles');
    }).not.toThrow();
  });

  test('should throw error when gpkg_contents entry missing', () => {
    mockSourceDb.prepare().get.mockReturnValueOnce(null);

    expect(() => {
      copyTileMetadata(mockSourceDb, mockTargetDb, 'missing_table', 'target_tiles');
    }).toThrow('No gpkg_contents entry found for table: missing_table');
  });

  test('should throw error when tile matrix set missing', () => {
    mockSourceDb.prepare().get
      .mockReturnValueOnce({ data_type: 'tiles' })
      .mockReturnValueOnce(null);

    expect(() => {
      copyTileMetadata(mockSourceDb, mockTargetDb, 'source_tiles', 'target_tiles');
    }).toThrow('No tile matrix set found for table: source_tiles');
  });

  test('should throw error when no tile matrix entries found', () => {
    mockSourceDb.prepare().get
      .mockReturnValueOnce({ data_type: 'tiles' })
      .mockReturnValueOnce({ srs_id: 4326 });
    mockSourceDb.prepare().all.mockReturnValueOnce([]);

    expect(() => {
      copyTileMetadata(mockSourceDb, mockTargetDb, 'source_tiles', 'target_tiles');
    }).toThrow('No tile matrix entries found for table: source_tiles');
  });
});
