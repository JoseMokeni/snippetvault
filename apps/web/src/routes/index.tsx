import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Copy,
  Download,
  Folder,
  FileCode,
  Check,
  Globe,
  Mail,
  Github,
  Linkedin,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="bg-bg-primary text-text-primary">
      <Navigation />
      <HeroSection />
      <BeforeAfterSection />
      <FeaturesSection />
      <UseCasesSection />
      <FinalCTASection />
      <BuiltBySection />
      <Footer />
    </div>
  );
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

        <div className="flex items-center gap-6 sm:gap-8">
          <a
            href="#features"
            className="text-text-secondary hover:text-text-primary transition-colors hidden sm:block"
          >
            Features
          </a>
          <Link
            to="/explore"
            search={{ language: undefined, sortBy: undefined, sortOrder: undefined }}
            className="text-text-secondary hover:text-accent transition-colors hidden sm:block"
          >
            Explore
          </Link>
          <Link
            to="/login"
            search={{ redirect: "/dashboard" }}
            className="bg-accent text-bg-primary px-4 py-2 font-medium hover:bg-accent-hover transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`FROM node:20-alpine
WORKDIR /app/my-app
EXPOSE 3000`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 dot-grid">
      <div className="max-w-6xl mx-auto">
        {/* Tagline */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight">
            Your code deserves a<br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            <span className="text-accent">second life.</span>
          </h1>
          <p className="text-text-secondary text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-body px-4">
            Multi-file snippets. Variable templating. One-click export.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4">
          <Link
            to="/signup"
            className="bg-accent text-bg-primary px-6 py-3 font-medium hover:bg-accent-hover transition-colors text-base sm:text-lg text-center"
          >
            Get Started Free
          </Link>
          <a
            href="https://github.com/JoseMokeni/snippetvault"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-border px-6 py-3 font-medium hover:border-text-secondary transition-colors text-base sm:text-lg text-center"
          >
            View on GitHub
          </a>
        </div>

        {/* Code Demo */}
        <div className="max-w-3xl mx-auto px-2 sm:px-0">
          <div className="terminal-block rounded-lg overflow-hidden glow-green">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-bg-secondary border-b border-border">
              <div className="w-3 h-3 rounded-full bg-error" />
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="ml-4 text-text-secondary text-sm font-display">
                demo.dockerfile
              </span>
            </div>

            {/* Code Content */}
            <div className="p-3 sm:p-6 font-display text-xs sm:text-sm">
              <div className="flex">
                <div className="text-text-tertiary select-none pr-2 sm:pr-6 text-right">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n}>{n}</div>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div>
                    <span className="text-syntax-comment">{`// Your snippet with variables`}</span>
                  </div>
                  <div>
                    <span className="text-syntax-keyword">FROM</span>{" "}
                    <span className="text-text-primary">node:</span>
                    <span className="text-accent">{`{{NODE_VERSION}}`}</span>
                    <span className="text-text-primary">-alpine</span>
                  </div>
                  <div>
                    <span className="text-syntax-keyword">WORKDIR</span>{" "}
                    <span className="text-text-primary">/app/</span>
                    <span className="text-accent">{`{{PROJECT_NAME}}`}</span>
                  </div>
                  <div>
                    <span className="text-syntax-keyword">EXPOSE</span>{" "}
                    <span className="text-accent">{`{{PORT}}`}</span>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border my-6" />

              {/* Variables */}
              <div className="space-y-3">
                <div className="text-text-secondary text-xs uppercase tracking-wider mb-4">
                  Variables
                </div>
                <VariableInput label="NODE_VERSION" defaultValue="20" />
                <VariableInput label="PROJECT_NAME" defaultValue="my-app" />
                <VariableInput label="PORT" defaultValue="3000" />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 bg-accent text-bg-primary px-4 py-2 font-medium hover:bg-accent-hover transition-colors text-sm"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied!" : "Copy Result"}
                </button>
                <button className="flex items-center justify-center gap-2 border border-border px-4 py-2 font-medium hover:border-text-secondary transition-colors text-sm">
                  <Download size={16} />
                  Download ZIP
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VariableInput({
  label,
  defaultValue,
}: {
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <span className="text-syntax-variable w-24 sm:w-32 truncate text-xs sm:text-sm">
        {label}
      </span>
      <span className="text-text-tertiary text-xs sm:text-sm">=</span>
      <input
        type="text"
        defaultValue={defaultValue}
        className="bg-bg-secondary border border-border px-2 sm:px-3 py-1 sm:py-1.5 text-text-primary w-20 sm:w-32 focus:border-accent focus:outline-none text-xs sm:text-sm"
      />
    </div>
  );
}

function BeforeAfterSection() {
  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 bg-bg-secondary">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12 px-4">
          The old way vs. the <span className="text-accent">SnippetVault</span>{" "}
          way
        </h2>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Before */}
          <div className="terminal-block rounded-lg p-4 sm:p-6 opacity-60">
            <div className="text-error font-display text-base sm:text-lg mb-4 sm:mb-6">
              Before
            </div>
            <ul className="space-y-2 sm:space-y-3 text-text-secondary text-sm sm:text-base">
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
              <div className="text-text-secondary mb-2">
                # Every. Single. Time.
              </div>
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
  );
}

function FeaturesSection() {
  const features = [
    {
      number: "01",
      title: "MULTI-FILE SNIPPETS",
      description: "Not just code. Entire project structures.",
      visual: (
        <div className="font-display text-xs sm:text-sm mt-3 sm:mt-4 space-y-1 overflow-x-auto">
          <div className="flex items-center gap-2">
            <Folder size={14} className="text-accent flex-shrink-0" />
            <span className="whitespace-nowrap">docker-setup/</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <FileCode size={14} className="text-text-secondary flex-shrink-0" />
            <span className="text-text-secondary whitespace-nowrap">
              Dockerfile
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <FileCode size={14} className="text-text-secondary flex-shrink-0" />
            <span className="text-text-secondary whitespace-nowrap">
              docker-compose.yml
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <FileCode size={14} className="text-text-secondary flex-shrink-0" />
            <span className="text-text-secondary whitespace-nowrap">
              .dockerignore
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Folder size={14} className="text-accent flex-shrink-0" />
            <span className="whitespace-nowrap">nginx/</span>
          </div>
          <div className="flex items-center gap-2 ml-8">
            <FileCode size={14} className="text-text-secondary flex-shrink-0" />
            <span className="text-text-secondary whitespace-nowrap">
              nginx.conf
            </span>
          </div>
        </div>
      ),
    },
    {
      number: "02",
      title: "VARIABLE TEMPLATING",
      description: "Write once. Customize infinitely.",
      visual: (
        <div className="font-display text-xs sm:text-sm mt-3 sm:mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-secondary whitespace-nowrap">
              FROM node:
            </span>
            <span className="text-accent whitespace-nowrap">{`{{NODE_VERSION}}`}</span>
            <span className="text-text-tertiary">→</span>
            <span className="text-success whitespace-nowrap">FROM node:20</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-secondary whitespace-nowrap">
              WORKDIR /
            </span>
            <span className="text-accent whitespace-nowrap">{`{{PROJECT}}`}</span>
            <span className="text-text-tertiary">→</span>
            <span className="text-success whitespace-nowrap">
              WORKDIR /my-api
            </span>
          </div>
        </div>
      ),
    },
    {
      number: "03",
      title: "ONE-CLICK EXPORT",
      description: "Copy all. Download ZIP. Full folder structure preserved.",
      visual: (
        <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
          <button className="flex items-center gap-1.5 sm:gap-2 bg-bg-secondary border border-border px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:border-text-secondary transition-colors whitespace-nowrap">
            <Copy size={14} className="flex-shrink-0" />
            <span>Copy All</span>
          </button>
          <button className="flex items-center gap-1.5 sm:gap-2 bg-bg-secondary border border-border px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:border-text-secondary transition-colors whitespace-nowrap">
            <Download size={14} className="flex-shrink-0" />
            <span>Download .zip</span>
          </button>
          <button className="flex items-center gap-1.5 sm:gap-2 bg-bg-secondary border border-border px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:border-text-secondary transition-colors whitespace-nowrap">
            <FileCode size={14} className="flex-shrink-0" />
            <span>Copy Single</span>
          </button>
        </div>
      ),
    },
    {
      number: "04",
      title: "SHARE ANYWHERE",
      description: "Generate shareable links. No login required.",
      visual: (
        <div className="font-display text-xs sm:text-sm mt-3 sm:mt-4">
          <div className="flex items-center gap-2 p-3 bg-bg-secondary border border-accent/30 rounded">
            <Globe size={14} className="text-accent flex-shrink-0" />
            <span className="text-text-tertiary font-mono truncate flex-1">
              snippetvault.app/s/abc123xyz
            </span>
            <button className="flex items-center gap-1.5 px-2 py-1 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors whitespace-nowrap text-xs">
              <Copy size={12} className="flex-shrink-0" />
              <span>Copy</span>
            </button>
          </div>
          <div className="mt-2 text-text-tertiary text-xs">
            → Read-only access for anyone with the link
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="features" className="py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {features.map((feature) => (
          <div
            key={feature.number}
            className="terminal-block rounded-lg p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6">
              <span className="text-accent font-display text-xl sm:text-2xl font-bold flex-shrink-0">
                {feature.number}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg sm:text-xl font-bold mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary text-sm sm:text-base">
                  {feature.description}
                </p>
                {feature.visual}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UseCasesSection() {
  const useCases = [
    {
      icon: "🐳",
      title: "Docker Setups",
      items: ["Dockerfile", "Compose", "Nginx"],
    },
    {
      icon: "⚛️",
      title: "React Components",
      items: ["Component", "Tests", "Stories"],
    },
    {
      icon: "🔧",
      title: "Configs",
      items: ["ESLint", "Prettier", "TypeScript"],
    },
    {
      icon: "🚀",
      title: "API Boilerplates",
      items: ["Routes", "Middleware", "Types"],
    },
  ];

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 bg-bg-secondary">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-lg sm:text-xl text-text-secondary mb-6 sm:mb-8">
          Perfect for...
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
  );
}

function FinalCTASection() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="terminal-block rounded-lg p-6 sm:p-8 glow-green">
          <div className="font-display text-text-tertiary mb-4 sm:mb-6 text-sm sm:text-base">
            $ npx create-snippet
          </div>

          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mb-4">
            Stop drowning in gists.
            <br />
            Start building your snippet library.
          </h2>

          <Link
            to="/signup"
            className="inline-block bg-accent text-bg-primary px-6 sm:px-8 py-3 sm:py-4 font-display font-medium text-base sm:text-lg hover:bg-accent-hover transition-colors mt-4 sm:mt-6"
          >
            Get Started — It's Free
          </Link>

          <p className="text-text-secondary mt-4 text-sm">
            Free forever. No credit card. No catch.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-8 sm:gap-12">
          <div className="max-w-xs">
            <div className="font-display text-base sm:text-lg flex items-center gap-1 mb-2">
              <span className="text-accent">{`>`}</span>
              <span>SnippetVault</span>
              <span className="animate-blink">_</span>
            </div>
            <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
              Built for developers who hate repeating themselves.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-12 text-xs sm:text-sm">
            <div>
              <div className="font-display text-text-secondary mb-3 font-semibold">
                Product
              </div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="hover:text-accent transition-colors block"
                  >
                    Features
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-1">
              <div className="font-display text-text-secondary mb-3 font-semibold">
                Connect
              </div>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/JoseMokeni/snippetvault"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors block"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com/josemokeni"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors block"
                  >
                    Twitter
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border-muted mt-8 pt-6 sm:pt-8 text-text-tertiary text-xs sm:text-sm text-center md:text-left">
          © 2026 SnippetVault. MIT Licensed.
        </div>
      </div>
    </footer>
  );
}

// Built By Section
function BuiltBySection() {
  return (
    <section className="border-t-4 border-border py-16 px-4 bg-bg-secondary">
      <div className="container mx-auto max-w-2xl text-center">
        <div className="mb-4 font-display text-sm text-text-secondary">
          BUILT BY
        </div>
        <h3 className="mb-2 text-2xl font-bold">José Mokeni</h3>
        <p className="mb-1 font-display text-sm text-text-secondary">
          Fullstack Software Engineer
        </p>
        <p className="mx-auto mb-6 max-w-md text-text-secondary">
          Built by an engineer who was tired of scattered gists and repetitive
          setup tasks.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://github.com/JoseMokeni"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 terminal-button px-4 py-2 font-display text-sm"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/jos%C3%A9-marie-mokeni-203b67226/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 terminal-button px-4 py-2 font-display text-sm"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </a>
          <a
            href="mailto:jmmokeni@gmail.com"
            className="inline-flex items-center gap-2 terminal-button px-4 py-2 font-display text-sm"
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        </div>
      </div>
    </section>
  );
}
