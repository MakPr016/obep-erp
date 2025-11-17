import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="text-muted-foreground">
          Manage student records and enrollment
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Management
          </CardTitle>
          <CardDescription>
            View and manage student information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Student management features coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
