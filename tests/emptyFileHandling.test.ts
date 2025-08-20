import * as Merge from "../merge";
import { fakeDb } from "./testHelpers";

beforeEach(() => {
  jest.resetAllMocks();

  // never touch a real DB
  jest.spyOn(Merge, "openDatabase").mockReturnValue(fakeDb());

  // keep the rest ultra-simple so tests only check wiring, not I/O
  jest.spyOn(Merge, "getDataTables").mockReturnValue(["tiles"] as any);
  jest
    .spyOn(Merge, "getTableColumns")
    .mockReturnValue(["zoom_level", "tile_column", "tile_row", "tile_data"] as any);
  jest.spyOn(Merge, "findTileTable").mockReturnValue("tiles" as any);
  jest.spyOn(Merge, "copyTileMetadata").mockImplementation((..._args: any[]) => undefined);
});

describe("empty file handling (unit)", () => {
  beforeEach(() => jest.resetAllMocks());

  test("returns early when file list is empty, without DB calls", () => {
    // Guard: if your code would open DB, stop it here
    const openSpy = jest.spyOn(Merge, "openDatabase").mockImplementation(() => {
      throw new Error("should not open DB in unit test");
    });

    // If there's a function that checks emptiness, call it directly.
    // Or mock helpers called before DB is touched:
    jest.spyOn(Merge, "validateFilesExist").mockReturnValue(true as any);

    // Call the unit under test in a way that never reaches DB layer.
    // e.g., Merge.processFileInfo([]) or whatever your pre-DB function is:
    const res = Merge.processFileInfo?.([] as any); // adjust to your API
    // assert your logic… or if it's supposed to throw, use expect().toThrow()

    expect(openSpy).not.toHaveBeenCalled();
  });
});
