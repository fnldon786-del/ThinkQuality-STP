import CreateFaiqUser from "../create-faiq-user"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function CreateFaiqPage() {
  return (
    <DashboardLayout role="Admin">
      <div className="container mx-auto py-8">
        <CreateFaiqUser />
      </div>
    </DashboardLayout>
  )
}
