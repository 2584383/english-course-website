import { NextResponse } from "next/server";

import { exportMyData } from "@/app/actions/rgpd";

/** Export RGPD : renvoie les données personnelles en JSON téléchargeable. */
export async function GET() {
  const data = await exportMyData();

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mes-donnees-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
