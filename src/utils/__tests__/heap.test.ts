import { LinearHeap, Heap, BinaryHeap } from "../heap";

describe("Heap", () => {
  const testHeap = (heap: Heap<number>) => {
    heap.add(0);
    heap.add(2);
    heap.add(1);

    expect(heap.pop()).toBe(2);
    expect(heap.pop()).toBe(1);
    expect(heap.pop()).toBe(0);
    expect(heap.pop()).toBe(null);

    heap.add(10);
    heap.add(9);

    expect(heap.pop()).toBe(10);
    expect(heap.pop()).toBe(9);
  };

  it("LinearHeap", () => {
    const linHeap = new LinearHeap<number>((i, j) => i - j);
    testHeap(linHeap);
  });

  it("BinaryHeap", () => {
    const binHeap = new BinaryHeap<number>((i, j) => i - j);
    testHeap(binHeap);
  });
});
