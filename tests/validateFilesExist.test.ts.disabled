jest.mock('../merge', () => ({
  ...jest.requireActual('../merge'),
  checkFileExists: jest.fn(),
  validateFilesExist: jest.requireActual('../merge').validateFilesExist
}));

import * as Merge from "../merge";

const mockCheckFileExists = Merge.checkFileExists as jest.MockedFunction<typeof Merge.checkFileExists>;

describe("validateFilesExist (unit)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("does not throw when files exist", () => {
    mockCheckFileExists.mockReturnValue(true);
    
    expect(() => {
      Merge.validateFilesExist("a", "b");
    }).not.toThrow();
    
    expect(mockCheckFileExists).toHaveBeenCalledTimes(2);
  });

  it("throws when files missing", () => {
    mockCheckFileExists.mockReturnValue(false);
    
    expect(() => {
      Merge.validateFilesExist("a", "b");
    }).toThrow("Missing file(s): a, b");
    
    expect(mockCheckFileExists).toHaveBeenCalledTimes(2);
  });
});
