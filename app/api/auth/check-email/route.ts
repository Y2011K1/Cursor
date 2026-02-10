import { NextResponse } from "next/server"
import { getAdminClient } from "@/lib/admin"

export const dynamic = "force-dynamic"

/**
 * POST body: { email: string }
 * Returns: { allowed: boolean }
 * Used before signup to block emails of permanently removed students.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    if (!email) {
      return NextResponse.json({ allowed: false }, { status: 400 })
    }

    let admin
    try {
      admin = getAdminClient()
    } catch (e) {
      console.error("check-email: admin client init failed", e)
      return NextResponse.json({ allowed: true }, { status: 200 })
    }

    const { data, error } = await admin
      .from("removed_student_emails")
      .select("email")
      .eq("email", email)
      .maybeSingle()

    if (error) {
      console.error("check-email error:", error)
      return NextResponse.json({ allowed: true }, { status: 200 })
    }

    return NextResponse.json({ allowed: !data })
  } catch (err) {
    console.error("check-email error:", err)
    return NextResponse.json({ allowed: true }, { status: 200 })
  }
}
