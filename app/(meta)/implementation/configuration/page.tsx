import Canvas from "@/app/components/Canvas";

export default function Page() {
  return (
    <div className="py-10">
      <h2 className="text-xl">Configuration</h2>
      <p>
        Schemapify is a web based cartographic schematization tool, written in
        Typescript. It aims to support the schematization of geo data
      </p>
      <div className="relative min-h-96 overflow-hidden rounded bg-gray-200/25">
        <Canvas />
      </div>
    </div>
  );
}
