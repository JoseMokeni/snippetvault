import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard/new')({
  component: NewSnippetPage,
})

function NewSnippetPage() {
  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold mb-4">Create New Snippet</h1>
      <p className="text-text-secondary">Coming soon...</p>
    </div>
  )
}
