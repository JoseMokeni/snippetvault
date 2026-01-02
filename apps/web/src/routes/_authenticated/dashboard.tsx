import { createFileRoute, Link } from '@tanstack/react-router'
import { Search, Plus, Folder, FileCode, Star, MoreVertical } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data for now - will be replaced with API calls
  const snippets = [
    {
      id: '1',
      title: 'Docker Node.js Setup',
      description: 'Complete Docker configuration for Node.js projects',
      language: 'dockerfile',
      filesCount: 3,
      isFavorite: true,
      tags: [{ name: 'Docker', color: '#2496ed' }, { name: 'Node.js', color: '#339933' }],
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      title: 'React Component Template',
      description: 'Reusable React component with TypeScript and tests',
      language: 'typescript',
      filesCount: 4,
      isFavorite: false,
      tags: [{ name: 'React', color: '#61dafb' }, { name: 'TypeScript', color: '#3178c6' }],
      updatedAt: new Date('2024-01-14'),
    },
    {
      id: '3',
      title: 'ESLint + Prettier Config',
      description: 'My preferred linting and formatting setup',
      language: 'json',
      filesCount: 2,
      isFavorite: true,
      tags: [{ name: 'Config', color: '#f59e0b' }],
      updatedAt: new Date('2024-01-10'),
    },
  ]

  const filteredSnippets = snippets.filter(
    (snippet) =>
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">All Snippets</h1>
          <p className="text-text-secondary mt-1">{snippets.length} snippets in your library</p>
        </div>
        <Link
          to="/dashboard/new"
          className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 font-medium hover:bg-accent-hover transition-colors"
        >
          <Plus size={18} />
          <span>New Snippet</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search snippets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-bg-secondary border border-border pl-12 pr-4 py-3 text-text-primary focus:border-accent focus:outline-none font-display"
        />
      </div>

      {/* Snippets Grid */}
      {filteredSnippets.length === 0 ? (
        <div className="text-center py-16">
          <Folder size={48} className="mx-auto text-text-tertiary mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">No snippets found</h2>
          <p className="text-text-secondary mb-6">
            {searchQuery ? 'Try a different search term' : 'Create your first snippet to get started'}
          </p>
          {!searchQuery && (
            <Link
              to="/dashboard/new"
              className="inline-flex items-center gap-2 bg-accent text-bg-primary px-6 py-3 font-medium hover:bg-accent-hover transition-colors"
            >
              <Plus size={18} />
              <span>Create Snippet</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSnippets.map((snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      )}
    </div>
  )
}

interface SnippetCardProps {
  snippet: {
    id: string
    title: string
    description: string
    language: string
    filesCount: number
    isFavorite: boolean
    tags: { name: string; color: string }[]
    updatedAt: Date
  }
}

function SnippetCard({ snippet }: SnippetCardProps) {
  return (
    <Link
      to="/dashboard/$snippetId"
      params={{ snippetId: snippet.id }}
      className="terminal-block rounded-lg p-5 hover:border-accent transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileCode size={18} className="text-accent" />
          <span className="font-display text-xs uppercase tracking-wider text-text-tertiary">
            {snippet.language}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {snippet.isFavorite && <Star size={16} className="text-warning fill-warning" />}
          <button
            onClick={(e) => {
              e.preventDefault()
              // Handle menu
            }}
            className="text-text-tertiary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <h3 className="font-display font-bold mb-2 group-hover:text-accent transition-colors">
        {snippet.title}
      </h3>
      <p className="text-text-secondary text-sm mb-4 line-clamp-2">{snippet.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder size={14} className="text-text-tertiary" />
          <span className="text-xs text-text-tertiary">{snippet.filesCount} files</span>
        </div>
        <div className="flex gap-1">
          {snippet.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.name}
              className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {snippet.tags.length > 2 && (
            <span className="text-xs px-2 py-0.5 rounded bg-bg-elevated text-text-tertiary">
              +{snippet.tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
