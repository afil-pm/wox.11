import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/guards";
import { normalizeSpecTemplate } from "@/lib/specs/normalize";
import { loadSpecTemplates } from "@/lib/specs/service";

export const dynamic = "force-dynamic";

/** Admin: list every specification template (stored + built-in presets). */
export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const templates = await loadSpecTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("GET /api/wox/admin/spec-templates error:", error);
    return NextResponse.json({ templates: [], error: "Failed to load templates" }, { status: 500 });
  }
}

/** Admin: create or replace the template for one category type. */
export async function PUT(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const result = normalizeSpecTemplate(body?.template ?? body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { connectMongoDB } = await import("@/lib/mongodb");
    const { default: SpecTemplate } = await import("@/lib/models/spec-template");
    await connectMongoDB();

    const { categoryType, name, fields, allowSupplierCustom } = result.template;
    const doc = await SpecTemplate.findOneAndUpdate(
      { categoryType },
      { $set: { name, fields, allowSupplierCustom } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ templateId: String(doc._id), categoryType });
  } catch (error) {
    console.error("PUT /api/wox/admin/spec-templates error:", error);
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}
