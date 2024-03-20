export default function Page() {
  return (
    <div className="py-10">
      <h2 className="text-xl">About this tool</h2>
      <p>
        Schemapify is a web based cartographic schematization tool, written in
        Typescript. It aims to support the schematization of geo data
        (Shapefile, GeoJSON) in an interactive and accessible way. It implements
        the algorithm proposed in:
        <span className="mt-2 block border-l p-1 px-4 font-mono">
          Area-Preserving Simplification and Schematization of Polygonal
          Subdivisions (Buchin, K., Meulemans, W., Van Renssen, A., & Speckmann,
          B. (2016). Area-Preserving Simplification and Schematization of
          Polygonal Subdivisions. ACM Transactions on Spatial Algorithms and
          Systems , 2(1), 1-36. [2].{" "}
          <a className="italic" href="https://doi.org/10.1145/2818373">
            https://doi.org/10.1145/2818373
          </a>
          .)
        </span>
      </p>
    </div>
  );
}
