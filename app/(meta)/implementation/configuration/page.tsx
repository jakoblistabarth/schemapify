import DcelViewer from "@/app/components/DcelViewer";
import DescriptionList from "@/app/components/DescriptionList";
import Math from "@/app/components/Math";
import { DcelStoreProvider } from "@/app/providers/dcel-store-provider";

export default function Page() {
  return (
    <div className="flex flex-col gap-10 py-10">
      <section>
        <h2>
          Configuration <Math>X</Math>
        </h2>
        <DescriptionList>
          <dt>
            <Math>
              ⟨e<sub>n-1</sub>, e<sub>n</sub>, e<sub>n+1</sub>⟩.
            </Math>
          </dt>
          <dd>
            3 consecutive edges that make up <Math>X</Math>.
          </dd>
          <dt>
            <Math>P</Math>
          </dt>
          <dl>
            The Polygon formed by <Math>X</Math>.
          </dl>
        </DescriptionList>
        <p>
          Configurations are important for the simplifying step in the
          algorithm.
        </p>
      </section>

      <section>
        <h2>Contraction</h2>
        <DescriptionList>
          <dt>
            <Math>
              R<sup>+</sup>(X)
            </Math>
          </dt>
          <dd>Positive contraction region.</dd>
          <dt>
            <Math>
              R<sup>-</sup>(X)
            </Math>
          </dt>
          <dd>Negative contraction region.</dd>
        </DescriptionList>
        <p>
          A contraction is an edge-move that causes one of the edges of{" "}
          <Math>X</Math> to reach length zero.
        </p>
      </section>
      <DcelStoreProvider>
        <DcelViewer />
      </DcelStoreProvider>
    </div>
  );
}
