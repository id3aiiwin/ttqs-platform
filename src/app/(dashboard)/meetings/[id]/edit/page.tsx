import { redirect } from 'next/navigation'

export default async function MeetingEditRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/meetings/${id}`)
}
