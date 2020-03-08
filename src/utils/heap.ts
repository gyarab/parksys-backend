export interface Heap<T> {
  add(elem: T): void;
  pop(): T;
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
  public pop(): T {
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

export class BinaryHeap<T> implements Heap<T> {
  public arr: Array<T>;
  private comparator: (o1: T, o2: T) => number;
  private topIndex: number = null;
  constructor(comparator: (o1: T, o2: T) => number) {
    // First element - to make the math simpler, we set the first element to null
    this.arr = [null];
    this.comparator = comparator;
  }

  // O(log N)
  add(elem: T): void {
    this.arr.push(elem);
    this.siftUp(this.arr.length - 1);
  }

  // O(log N)
  pop(): T {
    if (this.size() > 0) {
      this.swap(1, this.size());
      const returnValue: T = this.arr.pop();
      this.siftDown(1);
      return returnValue;
    } else {
      return null;
    }
  }

  // O(1)
  size(): number {
    return this.arr.length - 1;
  }

  private swap(a: number, b: number): void {
    const temp: T = this.arr[a];
    this.arr[a] = this.arr[b];
    this.arr[b] = temp;
  }

  private compare(a: number, b: number): number {
    return this.comparator(this.arr[a], this.arr[b]);
  }

  // Fix the heap from bottom to top starting at *index*
  private siftUp(index: number): void {
    const parent = Math.floor(index / 2);
    if (parent <= 0) return;
    if (this.compare(parent, index) < 0) {
      this.swap(parent, index);
      this.siftUp(parent);
    }
  }

  private siftDown(index: number): void {
    const childLeft = index * 2;
    const childRight = index * 2;

    const next = (childIndex: number) => {
      this.swap(index, childIndex);
      this.siftDown(childIndex);
    };

    if (this.size() < childLeft) {
      return;
    } else if (this.size() < childRight && this.compare(index, childLeft) < 0) {
      // One child: childLeft AND we should swap
      return next(childLeft);
    }

    const childCompare = this.compare(childLeft, childRight);

    if (childCompare < 0) {
      return next(childRight);
    } else if (childCompare > 0) {
      return next(childLeft);
    }
  }
}
