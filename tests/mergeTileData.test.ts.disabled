jest.mock('../merge', () => ({
  ...jest.requireActual('../merge'),
  openDatabase: jest.fn(),
  getDataTables: jest.fn(),
  getTableColumns: jest.fn(),
  mergeTileData: jest.requireActual('../merge').mergeTileData
}));

import * as Merge from "../merge";

const mockOpenDatabase = Merge.openDatabase as jest.MockedFunction<typeof Merge.openDatabase>;
const mockGetDataTables = Merge.getDataTables as jest.MockedFunction<typeof Merge.getDataTables>;
const mockGetTableColumns = Merge.getTableColumns as jest.MockedFunction<typeof Merge.getTableColumns>;

describe("mergeTileData (unit)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockOpenDatabase.mockReturnValue({ close: jest.fn() } as any);
  });

  it("returns 0 when no tables", () => {
    mockGetDataTables.mockReturnValue([]);
    
    const mockTargetDb = { exec: jest.fn(), prepare: jest.fn() };
    const result = Merge.mergeTileData(mockTargetDb as any, "a", "b", "c", true);
    
    expect(result).toBe(0);
    expect(mockGetDataTables).toHaveBeenCalled();
  });

  it("returns changes when tile table exists", () => {
    mockGetDataTables.mockReturnValue([{ name: "tiles" }]);
    mockGetTableColumns.mockReturnValue([{ name: "tile_data", type: "BLOB", notnull: 1, dflt_value: null, pk: 0 }]);
    
    const mockTargetDb = { 
      exec: jest.fn(), 
      prepare: jest.fn().mockReturnValue({ run: jest.fn().mockReturnValue({ changes: 5 }) })
    };
    
    const result = Merge.mergeTileData(mockTargetDb as any, "a", "b", "c", true);
    
    expect(result).toBe(5);
    expect(mockGetDataTables).toHaveBeenCalled();
    expect(mockGetTableColumns).toHaveBeenCalled();
  });
});
