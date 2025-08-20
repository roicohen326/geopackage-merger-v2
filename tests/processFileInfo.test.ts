import * as Merge from "../merge";

describe("processFileInfo (unit)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Merge, "getFileName").mockReturnValue("a");
    jest.spyOn(Merge, "getFileSize").mockReturnValue("b");
  });

  it("returns file info correctly", () => {
    const result = Merge.processFileInfo("c", true);
    
    expect(result).toEqual({
      path: "c",
      name: "a", 
      size: "b",
      priority: true
    });
    expect(Merge.getFileName).toHaveBeenCalledTimes(1);
    expect(Merge.getFileSize).toHaveBeenCalledTimes(1);
  });
});
