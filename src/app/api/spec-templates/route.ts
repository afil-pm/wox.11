import { NextResponse } from "next/server";
import { loadSpecTemplates } from "@/lib/specs/service";

export const dynamic = "force-dynamic";

/**
 * Read-only templates for the product forms, served straight from the
 * admin-controlled definitions.
 */
export async function GET() {
  try {
    const templates = await loadSpecTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("GET /api/spec-templates error:", error);
    return NextResponse.json({ templates: [] }, { status: 200 });
  }
}
