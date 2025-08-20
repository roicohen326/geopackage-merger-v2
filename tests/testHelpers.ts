export const simpleTable = (name: string) => ({ name });
export const simpleColumn = (name: string, type: string = 'TEXT') => ({ 
  name, 
  type, 
  notnull: 1, 
  dflt_value: null, 
  pk: 0 
});
