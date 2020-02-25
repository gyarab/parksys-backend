import * as types from "./types";

export default class MemoryCache implements types.Cache {
  private cache: object;

  constructor() {
    this.deleteAll();
  }

  get(key) {
    return this.cache[key];
  }

  set(key, value) {
    this.cache[key] = value;
  }

  delete(key) {
    const value = this.get(key);
    delete this.cache[key];
    return value;
  }

  deleteAll() {
    this.cache = {};
  }

  has(key) {
    return typeof this.cache[key] !== "undefined";
  }
}
