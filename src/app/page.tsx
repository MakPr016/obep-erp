// import { createClient } from '@/lib/supabase/server'

// export default async function Home() {
//   const supabase = await createClient()
  
//   const { data: departments } = await supabase
//     .from('departments')
//     .select('*')
  
//   return (
//     <main className="p-8">
//       <h1 className="text-2xl font-bold mb-4">OBEP ERP Setup Verification</h1>
      
//       <div className="space-y-4">
//         <div>
//           <h2 className="text-lg font-semibold">✅ Next.js App Router</h2>
//           <p className="text-sm text-muted-foreground">Working</p>
//         </div>
        
//         <div>
//           <h2 className="text-lg font-semibold">✅ Tailwind CSS</h2>
//           <p className="text-sm text-muted-foreground">Working</p>
//         </div>
        
//         <div>
//           <h2 className="text-lg font-semibold">
//             {departments ? '✅' : '❌'} Supabase Connection
//           </h2>
//           <p className="text-sm text-muted-foreground">
//             {departments ? `Connected - ${departments.length} departments` : 'Not connected'}
//           </p>
//         </div>
//       </div>
//     </main>
//   )
// }


import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (session) {
    const role = session.user?.role || "faculty"
    redirect(`/${role}`)
  }

  redirect("/login")
}
