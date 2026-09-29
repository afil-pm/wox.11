import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/guards";
import { visibleSpecFields } from "@/lib/specs/normalize";
import { loadSpecTemplates } from "@/lib/specs/service";

export const dynamic = "force-dynamic";

/**
 * Read-only templates for the product forms. Admins get every field; everyone
 * else (suppliers, guests) only sees the fields the admin allowed them to
 * edit, so the permission model is enforced server side and not just in the UI.
 */
export async function GET(request: NextRequest) {
  try {
    const role = isAdmin(request) ? "admin" : "supplier";
    const templates = await loadSpecTemplates();
    return NextResponse.json({
      templates: templates.map((template) => ({
        ...template,
        fields: visibleSpecFields(template.fields, role),
      })),
    });
  } catch (error) {
    console.error("GET /api/spec-templates error:", error);
    return NextResponse.json({ templates: [] }, { status: 200 });
  }
}
