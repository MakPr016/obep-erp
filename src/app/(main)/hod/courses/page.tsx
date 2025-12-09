import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Courses</h1>
        <p className="text-muted-foreground">
          Manage courses and curriculum
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Courses Management
          </CardTitle>
          <CardDescription>
            View and manage all courses across departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Course management features coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
