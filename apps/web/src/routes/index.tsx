import { createFileRoute, Link } from '@tanstack/react-router'
import { Copy, Download, Folder, FileCode, Check } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Navigation />
      <HeroSection />
      <BeforeAfterSection />
      <FeaturesSection />
      <UseCasesSection />
      <FinalCTASection />
      <Footer />
    </div>
  )
}

function Navigation() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-transparent bg-bg-primary/80 backdrop-blur-md border-border-muted">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-lg flex items-center gap-1">
          <span className="text-accent">{`>`}</span>
          <span>SnippetVault</span>
          <span className="animate-blink">_</span>
        </Link>

        <div className="flex items-center gap-8">
          <a href="#features" className="text-text-secondary hover:text-text-primary transition-colors hidden sm:block">
            Features
          </a>
          <Link
            to="/login"
            search={{ redirect: '/dashboard' }}
            className="bg-accent text-bg-primary px-4 py-2 font-medium hover:bg-accent-hover transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`FROM node:20-alpine
WORKDIR /app/my-app
EXPOSE 3000`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="pt-32 pb-20 px-6 dot-grid">
      <div className="max-w-6xl mx-auto">
        {/* Tagline */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Your code deserves a<br />
            <span className="text-accent">second life.</span>
          </h1>
          <p className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto font-body">
            Multi-file snippets. Variable templating. One-click export.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4 mb-16">
          <Link
            to="/signup"
            className="bg-accent text-bg-primary px-6 py-3 font-medium hover:bg-accent-hover transition-colors text-lg"
          >
            Get Started Free
          </Link>
          <a
            href="https://github.com/snippetvault"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-border px-6 py-3 font-medium hover:border-text-secondary transition-colors text-lg"
          >
            View on GitHub
          </a>
        </div>

        {/* Code Demo */}
        <div className="max-w-3xl mx-auto">
          <div className="terminal-block rounded-lg overflow-hidden glow-green">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-bg-secondary border-b border-border">
              <div className="w-3 h-3 rounded-full bg-error" />
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="ml-4 text-text-secondary text-sm font-display">demo.dockerfile</span>
            </div>

            {/* Code Content */}
            <div className="p-6 font-display text-sm">
              <div className="flex">
                <div className="text-text-tertiary select-none pr-6 text-right">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n}>{n}</div>
                  ))}
                </div>
                <div className="flex-1">
                  <div>
                    <span className="text-syntax-comment">{`// Your snippet with variables`}</span>
                  </div>
                  <div>
                    <span className="text-syntax-keyword">FROM</span>{' '}
                    <span className="text-text-primary">node:</span>
                    <span className="text-accent">{`{{NODE_VERSION}}`}</span>
                    <span className="text-text-primary">-alpine</span>
                  </div>
                  <div>
                    <span className="text-syntax-keyword">WORKDIR</span>{' '}
                    <span className="text-text-primary">/app/</span>
                    <span className="text-accent">{`{{PROJECT_NAME}}`}</span>
                  </div>
                  <div>
                    <span className="text-syntax-keyword">EXPOSE</span>{' '}
                    <span className="text-accent">{`{{PORT}}`}</span>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border my-6" />

              {/* Variables */}
              <div className="space-y-3">
                <div className="text-text-secondary text-xs uppercase tracking-wider mb-4">Variables</div>
                <VariableInput label="NODE_VERSION" defaultValue="20" />
                <VariableInput label="PROJECT_NAME" defaultValue="my-app" />
                <VariableInput label="PORT" defaultValue="3000" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 font-medium hover:bg-accent-hover transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Result'}
                </button>
                <button className="flex items-center gap-2 border border-border px-4 py-2 font-medium hover:border-text-secondary transition-colors">
                  <Download size={16} />
                  Download ZIP
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function VariableInput({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-syntax-variable w-32">{label}</span>
      <span className="text-text-tertiary">=</span>
      <input
        type="text"
        defaultValue={defaultValue}
        className="bg-bg-secondary border border-border px-3 py-1.5 text-text-primary w-32 focus:border-accent focus:outline-none"
      />
    </div>
  )
}

function BeforeAfterSection() {
  return (
    <section className="py-20 px-6 bg-bg-secondary">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-12">
          The old way vs. the <span className="text-accent">SnippetVault</span> way
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Before */}
          <div className="terminal-block rounded-lg p-6 opacity-60">
            <div className="text-error font-display text-lg mb-6">Before</div>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <span className="text-error">✗</span>
                <span>Scattered gists everywhere</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-error">✗</span>
                <span>Single file snippets only</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-error">✗</span>
                <span>Manual find & replace</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-error">✗</span>
                <span>Copy file by file</span>
              </li>
            </ul>

            <div className="mt-8 font-display text-sm text-text-tertiary">
              <div className="text-text-secondary mb-2"># Every. Single. Time.</div>
              <div>sed 's/old-name/new/g' file.js</div>
              <div>mv file1.js newproject/</div>
              <div>mv file2.js newproject/</div>
              <div>mv file3.js newproject/</div>
              <div>...</div>
            </div>
          </div>

          {/* After */}
          <div className="terminal-block rounded-lg p-6 border-accent glow-green-sm">
            <div className="text-accent font-display text-lg mb-6">After</div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-accent">✓</span>
                <span>One organized library</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">✓</span>
                <span>Full folder structures</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">✓</span>
                <span>{`{{VARIABLE}}`} templating</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">✓</span>
                <span>Export as ZIP instantly</span>
              </li>
            </ul>

            <div className="mt-8 font-display text-sm">
              <div className="text-text-secondary mb-2"># Once. Forever.</div>
              <button className="bg-accent text-bg-primary px-4 py-2 mt-2">
                Download ZIP
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      number: '01',
      title: 'MULTI-FILE SNIPPETS',
      description: 'Not just code. Entire project structures.',
      visual: (
        <div className="font-display text-sm mt-4 space-y-1">
          <div className="flex items-center gap-2">
            <Folder size={14} className="text-accent" />
            <span>docker-setup/</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <FileCode size={14} className="text-text-secondary" />
            <span className="text-text-secondary">Dockerfile</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <FileCode size={14} className="text-text-secondary" />
            <span className="text-text-secondary">docker-compose.yml</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <FileCode size={14} className="text-text-secondary" />
            <span className="text-text-secondary">.dockerignore</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Folder size={14} className="text-accent" />
            <span>nginx/</span>
          </div>
          <div className="flex items-center gap-2 ml-8">
            <FileCode size={14} className="text-text-secondary" />
            <span className="text-text-secondary">nginx.conf</span>
          </div>
        </div>
      ),
    },
    {
      number: '02',
      title: 'VARIABLE TEMPLATING',
      description: 'Write once. Customize infinitely.',
      visual: (
        <div className="font-display text-sm mt-4 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-text-secondary">FROM node:</span>
            <span className="text-accent">{`{{NODE_VERSION}}`}</span>
            <span className="text-text-tertiary">→</span>
            <span className="text-success">FROM node:20</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-secondary">WORKDIR /</span>
            <span className="text-accent">{`{{PROJECT}}`}</span>
            <span className="text-text-tertiary">→</span>
            <span className="text-success">WORKDIR /my-api</span>
          </div>
        </div>
      ),
    },
    {
      number: '03',
      title: 'ONE-CLICK EXPORT',
      description: 'Copy all. Download ZIP. Full folder structure preserved.',
      visual: (
        <div className="flex gap-3 mt-4">
          <button className="flex items-center gap-2 bg-bg-secondary border border-border px-3 py-2 text-sm hover:border-text-secondary transition-colors">
            <Copy size={14} />
            Copy All
          </button>
          <button className="flex items-center gap-2 bg-bg-secondary border border-border px-3 py-2 text-sm hover:border-text-secondary transition-colors">
            <Download size={14} />
            Download .zip
          </button>
          <button className="flex items-center gap-2 bg-bg-secondary border border-border px-3 py-2 text-sm hover:border-text-secondary transition-colors">
            <FileCode size={14} />
            Copy Single
          </button>
        </div>
      ),
    },
  ]

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {features.map((feature) => (
          <div key={feature.number} className="terminal-block rounded-lg p-6">
            <div className="flex items-start gap-6">
              <span className="text-accent font-display text-2xl font-bold">{feature.number}</span>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
                {feature.visual}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function UseCasesSection() {
  const useCases = [
    { icon: '🐳', title: 'Docker Setups', items: ['Dockerfile', 'Compose', 'Nginx'] },
    { icon: '⚛️', title: 'React Components', items: ['Component', 'Tests', 'Stories'] },
    { icon: '🔧', title: 'Configs', items: ['ESLint', 'Prettier', 'TypeScript'] },
    { icon: '🚀', title: 'API Boilerplates', items: ['Routes', 'Middleware', 'Types'] },
  ]

  return (
    <section className="py-20 px-6 bg-bg-secondary">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-xl text-text-secondary mb-8">Perfect for...</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="terminal-block rounded-lg p-4 hover:border-accent transition-colors cursor-default"
            >
              <div className="text-3xl mb-3">{useCase.icon}</div>
              <div className="font-display font-bold mb-2">{useCase.title}</div>
              <ul className="text-sm text-text-secondary space-y-1">
                {useCase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="terminal-block rounded-lg p-8 glow-green">
          <div className="font-display text-text-tertiary mb-6">
            $ npx create-snippet
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
            Stop drowning in gists.<br />
            Start building your snippet library.
          </h2>

          <Link
            to="/signup"
            className="inline-block bg-accent text-bg-primary px-8 py-4 font-display font-medium text-lg hover:bg-accent-hover transition-colors mt-6"
          >
            Get Started — It's Free
          </Link>

          <p className="text-text-secondary mt-4 text-sm">
            Free forever. No credit card. No catch.
          </p>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="font-display text-lg flex items-center gap-1 mb-2">
              <span className="text-accent">{`>`}</span>
              <span>SnippetVault</span>
              <span className="animate-blink">_</span>
            </div>
            <p className="text-text-secondary text-sm">
              Built for developers who hate repeating themselves.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 text-sm">
            <div>
              <div className="font-display text-text-secondary mb-3">Product</div>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-accent transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <div className="font-display text-text-secondary mb-3">Resources</div>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-accent transition-colors">Docs</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <div className="font-display text-text-secondary mb-3">Connect</div>
              <ul className="space-y-2">
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">GitHub</a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border-muted mt-8 pt-8 text-text-tertiary text-sm">
          © 2026 SnippetVault. MIT Licensed.
        </div>
      </div>
    </footer>
  )
}
