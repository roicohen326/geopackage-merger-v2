import * as Merge from "../merge";

describe("createTileTable (unit)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Merge, "openDatabase").mockReturnValue({ close: jest.fn() } as any);
    jest.spyOn(Merge, "copyTileMetadata").mockImplementation(() => {});
  });

  it("throws when findTileTable returns null", () => {
    jest.spyOn(Merge, "findTileTable").mockReturnValue(null);
    
    const mockTargetDb = { exec: jest.fn() };
    
    expect(() => {
      Merge.createTileTable(mockTargetDb as any, "a", "b", "c");
    }).toThrow();
  });

  it("creates table when findTileTable returns table", () => {
    jest.spyOn(Merge, "findTileTable")
      .mockReturnValueOnce({ name: "tiles" })
      .mockReturnValueOnce(null);
    
    const mockTargetDb = { exec: jest.fn() };
    
    Merge.createTileTable(mockTargetDb as any, "a", "b", "c");
    
    expect(mockTargetDb.exec).toHaveBeenCalled();
  });
});
