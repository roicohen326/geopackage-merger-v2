jest.mock('../merge', () => ({
  ...jest.requireActual('../merge'),
  getDataTables: jest.fn(),
  getTableColumns: jest.fn(),
  findTileTable: jest.requireActual('../merge').findTileTable
}));

import * as Merge from "../merge";

const mockGetDataTables = Merge.getDataTables as jest.MockedFunction<typeof Merge.getDataTables>;
const mockGetTableColumns = Merge.getTableColumns as jest.MockedFunction<typeof Merge.getTableColumns>;

describe("findTileTable (unit)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns table when tile_data exists", () => {
    mockGetDataTables.mockReturnValue([{ name: "tiles" }]);
    mockGetTableColumns.mockReturnValue([{ name: "tile_data", type: "BLOB", notnull: 1, dflt_value: null, pk: 0 }]);
    
    const result = Merge.findTileTable({} as any);
    
    expect(result).toEqual({ name: "tiles" });
    expect(mockGetDataTables).toHaveBeenCalledTimes(1);
    expect(mockGetTableColumns).toHaveBeenCalledTimes(1);
  });

  it("returns null when no tile_data", () => {
    mockGetDataTables.mockReturnValue([{ name: "features" }]);
    mockGetTableColumns.mockReturnValue([{ name: "geometry", type: "BLOB", notnull: 1, dflt_value: null, pk: 0 }]);
    
    const result = Merge.findTileTable({} as any);
    
    expect(result).toBeNull();
    expect(mockGetDataTables).toHaveBeenCalledTimes(1);
    expect(mockGetTableColumns).toHaveBeenCalledTimes(1);
  });

  it("returns null when no tables", () => {
    mockGetDataTables.mockReturnValue([]);
    
    const result = Merge.findTileTable({} as any);
    
    expect(result).toBeNull();
    expect(mockGetDataTables).toHaveBeenCalledTimes(1);
  });
});
