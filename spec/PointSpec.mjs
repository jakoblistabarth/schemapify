import Point from "../assets/lib/Point.mjs";

describe("distanceToPoint()", function () {
  it("returns the correct distance between 2 vertices", function () {
    const a = new Point(0, 0);
    const b = new Point(4, 0);
    const c = new Point(4, 4);
    const d = new Point(-4, -4);

    expect(b.distanceToPoint(a)).toEqual(b.distanceToPoint(a));
    expect(a.distanceToPoint(b)).toEqual(4);
    expect(a.distanceToPoint(c)).toEqual(Math.sqrt(4 * 4 + 4 * 4));
    expect(d.distanceToPoint(a)).toEqual(Math.sqrt(-4 * -4 + -4 * -4));
  });
});
