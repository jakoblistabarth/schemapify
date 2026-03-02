import getTestFiles from "@/app/helpers/getTestFiles";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ fileName: string }>;
  },
) {
  const { fileName } = await params;
  const files = getTestFiles();
  const file = files.find((d) => d.name === fileName);
  if (!file) return NextResponse.json({ error: "file not available" });
  const data = JSON.parse(readFileSync(file?.path, "utf-8"));
  return NextResponse.json(data);
}
