interface Heap<T> {
  add(elem: T): void;
  extractTop(): T;
  size(): number;
}

export class LinearHeap<T> implements Heap<T> {
  public arr: Array<T>;
  private comparator;
  private topIndex: number = null;
  constructor(comparator: (o1: T, o2: T) => number) {
    this.arr = [];
    this.comparator = comparator;
  }

  public size(): number {
    return this.arr.length;
  }

  // O(1)
  public add(elem: T) {
    this.arr.push(elem);
    const i = this.arr.length - 1;
    if (this.topIndex == null) {
      this.topIndex = 0;
    } else if (this.comparator(this.arr[i], this.arr[this.topIndex]) > 0) {
      this.topIndex = i;
    }
  }

  // O(N)
  public extractTop(): T {
    if (this.arr.length > 0) {
      const top = this.arr[this.topIndex];
      this.arr.splice(this.topIndex, 1);
      // Find the next max
      this.topIndex = this.arr.reduce<[number, T]>(
        ([i, top], current, j) => {
          if (this.comparator(top, current) > 0) {
            return [i, top];
          } else {
            return [j, current];
          }
        },
        [0, this.arr[0]]
      )[0];
      return top;
    } else {
      return null;
    }
  }
}

// TODO: Make a binary heap which is faster than the linear heap
