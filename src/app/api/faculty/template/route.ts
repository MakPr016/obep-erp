import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role === 'faculty') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Generate CSV template
  const headers = ["Full Name", "Email", "Password"]
  const sampleRow = ["John Doe", "john.doe@example.com", "SecurePass123"]
  
  const csvContent = [
    headers.join(","),
    sampleRow.join(",")
  ].join("\n")

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="faculty_import_template.csv"`,
    },
  })
}
