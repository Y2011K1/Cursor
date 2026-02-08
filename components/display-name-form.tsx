"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateDisplayName } from "@/app/actions/profile"
import { User } from "lucide-react"

export function DisplayNameForm({ initialName }: { initialName: string }) {
  const [state, formAction] = useActionState(
    async (_: unknown, fd: FormData) => {
      const result = await updateDisplayName(fd)
      return result.error ? { error: result.error } : { success: true }
    },
    null as { error?: string; success?: boolean } | null
  )

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Display name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={initialName}
          placeholder="Your name"
          className="mt-1 rounded-xl"
          required
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-success-green">Name updated.</p>
      )}
      <Button type="submit" size="sm" className="rounded-xl">
        Save name
      </Button>
    </form>
  )
}
