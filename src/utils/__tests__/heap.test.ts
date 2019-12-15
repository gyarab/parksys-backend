import { LinearHeap } from "../heap";

describe("LinearHeap", () => {
  it("should work", () => {
    const heap = new LinearHeap<number>((i, j) => i - j);
    heap.add(0);
    heap.add(2);
    heap.add(1);

    expect(heap.extractTop()).toBe(2);
    expect(heap.extractTop()).toBe(1);
    expect(heap.extractTop()).toBe(0);
    expect(heap.extractTop()).toBe(null);

    heap.add(10);
    heap.add(9);

    expect(heap.extractTop()).toBe(10);
    expect(heap.extractTop()).toBe(9);
  });
});
