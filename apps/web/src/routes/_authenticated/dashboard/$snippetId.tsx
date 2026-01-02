import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard/$snippetId')({
  component: SnippetDetailPage,
})

function SnippetDetailPage() {
  const { snippetId } = Route.useParams()

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold mb-4">Snippet: {snippetId}</h1>
      <p className="text-text-secondary">Coming soon...</p>
    </div>
  )
}
