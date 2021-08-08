import Contraction from "./Contraction";

class ConfigurationPair {
  contraction: Contraction;
  compensation: Contraction;

  constructor(contraction: Contraction, compensation: Contraction) {
    this.contraction = contraction;
    this.compensation = compensation;
  }

  doEdgeMove() {
    // 1. calculate compensation trapeze height
    const shift = this.compensation.getCompensationHeight(this.contraction.area);
    if (!shift) return;

    // 2. do compensation
    const compensationEdge = this.compensation.configuration.innerEdge;
    const normal = compensationEdge.getVector()?.getNormal().getUnitVector().times(shift);
    if (!normal) return;
    const newTail = compensationEdge.tail.toVector().plus(normal).toPoint();
    const newHead = compensationEdge.getHead()?.toVector().plus(normal).toPoint();
    if (!newHead) return;
    compensationEdge.move(newTail, newHead);

    // 1. do contraction
    const contractionEdge = this.contraction.configuration.innerEdge;
    contractionEdge.move(this.contraction.point, this.contraction.areaPoints[3]);

    //TODO: update affected configurations, the affected ffb (1 or 2?),
  }
}

export default ConfigurationPair;
