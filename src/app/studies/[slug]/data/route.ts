import { NextRequest, NextResponse } from "next/server";
import { getStudy, studyExport } from "@/data/studies";

function csvEscape(value: unknown) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = getStudy(slug);
  const data = studyExport(slug);
  if (!study || !data) return new NextResponse("Study not found", { status: 404 });

  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  if (format === "json") {
    return NextResponse.json({ study: { slug: study.slug, title: study.title, date: study.date }, headers: data.headers, rows: data.rows }, {
      headers: { "Content-Disposition": `attachment; filename="${study.slug}.json"` },
    });
  }

  const csv = [data.headers.map(csvEscape).join(","), ...data.rows.map((row) => row.map(csvEscape).join(","))].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${study.slug}.csv"`,
    },
  });
}
