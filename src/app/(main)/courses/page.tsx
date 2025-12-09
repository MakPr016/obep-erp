import { Suspense } from "react"
import { CourseList } from "@/components/courses/course-list"
import { CourseFilters } from "@/components/courses/course-filters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
          <CardDescription>
            View and manage course information across all departments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <CourseFilters />
          </Suspense>
          
          <Suspense fallback={<CoursesLoadingSkeleton />}>
            <CourseList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function CoursesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
