import getTestFiles from "@/app/helpers/getTestFiles";
import { NextResponse } from "next/server";

export async function GET() {
  const files = getTestFiles();
  return NextResponse.json(files);
}
