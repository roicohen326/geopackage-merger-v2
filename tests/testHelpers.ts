export const simpleTable = (name: string) => ({ name });
export const simpleColumn = (name: string, type: string = 'TEXT') => ({ 
  name, 
  type, 
  notnull: 1, 
  dflt_value: null, 
  pk: 0 
});
export const fakeDb = () => ({
  close: jest.fn(),
  prepare: jest.fn(() => ({
    all: jest.fn(() => []),
    get: jest.fn(() => undefined),
    run: jest.fn(() => undefined),
  })),
}) as any;
