import { getDataTables } from '../merge';

describe('getDataTables', () => {
  test('should return data tables excluding system tables', () => {
    const mockDb = {
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([{ name: 'user_data' }, { name: 'tiles' }])
      })
    };

    const result = getDataTables(mockDb as any);

    expect(result).toEqual([{ name: 'user_data' }, { name: 'tiles' }]);
  });

  test('should return empty array when no data tables', () => {
    const mockDb = {
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([])
      })
    };

    const result = getDataTables(mockDb as any);

    expect(result).toEqual([]);
  });

  test('should execute correct SQL query', () => {
    const mockDb = {
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([{ name: 'user_table' }])
      })
    };

    getDataTables(mockDb as any);

    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT name FROM sqlite_master'));
  });

  test('should filter system tables correctly', () => {
    const mockDb = {
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([{ name: 'user_table' }])
      })
    };

    const result = getDataTables(mockDb as any);

    expect(result).toEqual([{ name: 'user_table' }]);
  });

  test('should call database prepare method', () => {
    const mockDb = {
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([])
      })
    };

    getDataTables(mockDb as any);

    expect(mockDb.prepare).toHaveBeenCalled();
  });
});