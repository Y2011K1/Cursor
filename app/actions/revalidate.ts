"use server"

import { revalidatePath } from "next/cache"

export async function revalidateDashboards() {
  // Revalidate admin dashboard
  revalidatePath("/dashboard/admin")
  
  // Revalidate student dashboard
  revalidatePath("/dashboard/student")
  return { success: true }
}
