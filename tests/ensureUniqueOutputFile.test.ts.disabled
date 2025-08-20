// Mock fs directly since ensureUniqueOutputFile uses fs.existsSync directly
jest.mock('fs', () => ({
  existsSync: jest.fn()
}));

import * as Merge from "../merge";
import * as fs from 'fs';

const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

describe("ensureUniqueOutputFile (unit)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it("returns original when file does not exist", () => {
    mockExistsSync.mockReturnValue(false);
    
    const result = Merge.ensureUniqueOutputFile("test");
    
    expect(result).toBe("test");
  });

  it("generates unique name when file exists", () => {
    mockExistsSync.mockReturnValue(true);
    
    const result = Merge.ensureUniqueOutputFile("test");
    
    expect(result).toBe("test_1234567890");
  });
});
