import path from 'path';
import { createTileTable } from '../merge';
import * as merge from '../merge';

describe('createTileTable', () => {
  let mockTargetDb: any;
  let mockSourceDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTargetDb = {
      exec: jest.fn()
    };

    mockSourceDb = {
      close: jest.fn()
    };

    jest.spyOn(merge, 'openDatabase').mockReturnValue(mockSourceDb as any);
    jest.spyOn(merge, 'findTileTable')
      .mockReturnValueOnce({ name: 'source_tiles' })
      .mockReturnValueOnce(null);
    jest.spyOn(merge, 'copyTileMetadata').mockImplementation(() => {});
  });

  test('should create tile table with correct schema', () => {
    createTileTable(mockTargetDb, 'merged_tiles', '/file1.gpkg', '/file2.gpkg');

    expect(mockTargetDb.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE "merged_tiles"'));
  });

  test('should throw error when no tile tables found in sources', () => {
    jest.spyOn(merge, 'findTileTable').mockReturnValue(null);

    expect(() => {
      createTileTable(mockTargetDb, 'merged_tiles', '/file1.gpkg', '/file2.gpkg');
    }).toThrow('No tile tables found for metadata template');
  });

  test('should use first available tile table as template', () => {
    createTileTable(mockTargetDb, 'merged_tiles', '/file1.gpkg', '/file2.gpkg');

    expect(merge.copyTileMetadata).toHaveBeenCalled();
  });

  test('should close all opened databases', () => {
    createTileTable(mockTargetDb, 'merged_tiles', '/file1.gpkg', '/file2.gpkg');

    expect(mockSourceDb.close).toHaveBeenCalled();
  });
});
