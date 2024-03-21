import Canvas from "@/app/components/Canvas";

export default function Page() {
  return (
    <div className="py-10">
      <h2 className="text-xl">Configuration</h2>
      <p>A configuration is the sequence of 3 edges (en-1, e, en+1)</p>
      <div className="relative my-5 min-h-96 overflow-hidden rounded bg-gray-200/25">
        <Canvas />
      </div>
    </div>
  );
}
