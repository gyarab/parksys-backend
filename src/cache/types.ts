export interface Cache {
  // Sets value
  set(key: string, value: any);
  // Gets value
  get(key: string): any;
  // Deletes value and returns
  delete(key: string): any;
  has(key: string): boolean;
  deleteAll();
}
