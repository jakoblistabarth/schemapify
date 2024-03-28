import Canvas from "@/app/components/Canvas";
import DescriptionList from "@/app/components/DescriptionList";
import Math from "@/app/components/Math";

export default function Page() {
  return (
    <div className="py-10">
      <h2 className="text-xl">
        Configuration <Math>X</Math>
      </h2>
      <DescriptionList>
        <dt>
          <Math>
            ⟨e<sub>n-1</sub>, e<sub>n</sub>, e<sub>n+1</sub>⟩
          </Math>
        </dt>
        <dd>
          3 consecutive edges that make up <Math>X</Math>
        </dd>
        <dt>
          <Math>P</Math>
        </dt>
        <dl>
          The Polygon formed by <Math>X</Math>
        </dl>
      </DescriptionList>
      <p>
        Configurations are important for the simplifying step in the algorithm.
      </p>

      <div className="relative my-5 min-h-96 overflow-hidden rounded bg-gray-200/25">
        <Canvas />
      </div>
    </div>
  );
}
