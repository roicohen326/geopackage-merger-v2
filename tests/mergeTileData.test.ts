import { mergeTileData } from '../merge';
import * as merge from '../merge';
import path from 'path';
const dbPath = path.resolve(__dirname, 'fixtures/file1.gpkg');

describe('mergeTileData', () => {
  let mockTargetDb: any;
  let mockSourceDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTargetDb = {
      exec: jest.fn(),
      prepare: jest.fn().mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 100 })
      })
    };

    mockSourceDb = {
      close: jest.fn()
    };

    jest.spyOn(merge, 'openDatabase').mockReturnValue(mockSourceDb as any);
    jest.spyOn(merge, 'getDataTables').mockReturnValue([
      { name: 'tiles_table' },
      { name: 'regular_table' }
    ]);
    jest.spyOn(merge, 'getTableColumns')
      .mockReturnValueOnce([{ 
        name: 'tile_data', 
        type: 'BLOB', 
        notnull: 1, 
        dflt_value: null, 
        pk: 0 
      }])
      .mockReturnValueOnce([{ 
        name: 'id', 
        type: 'INTEGER', 
        notnull: 1, 
        dflt_value: null, 
        pk: 1 
      }]);
  });

  test('should merge tiles with INSERT OR IGNORE strategy', () => {
    const result = mergeTileData(mockTargetDb, 'merged_tiles', '/source.gpkg', 'source', true);

    expect(mockTargetDb.exec).toHaveBeenCalledWith("ATTACH DATABASE '/source.gpkg' AS source_db");
    expect(mockTargetDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT OR IGNORE'));
    expect(result).toBe(100);
  });

  test('should merge tiles with INSERT OR REPLACE strategy', () => {
    const result = mergeTileData(mockTargetDb, 'merged_tiles', '/source.gpkg', 'source', false);

    expect(mockTargetDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE'));
    expect(result).toBe(100);
  });

  test('should skip non-tile tables', () => {
    jest.spyOn(merge, 'getTableColumns').mockReturnValue([{ 
      name: 'id', 
      type: 'INTEGER', 
      notnull: 1, 
      dflt_value: null, 
      pk: 1 
    }]);

    const result = mergeTileData(mockTargetDb, 'merged_tiles', '/source.gpkg', 'source', true);

    expect(result).toBe(0);
  });

  test('should properly detach database', () => {
    mergeTileData(mockTargetDb, 'merged_tiles', '/source.gpkg', 'source', true);

    expect(mockTargetDb.exec).toHaveBeenCalledWith('DETACH DATABASE source_db');
  });
});
