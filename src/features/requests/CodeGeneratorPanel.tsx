import { useState } from 'react'
import { type RequestRecord } from '../../domain/models'
import { generateAllCode } from '../../lib/codegen/generators'
import './CodeGeneratorPanel.css'

interface CodeGeneratorPanelProps {
  request: RequestRecord
}

type CodeLanguage = 'curl' | 'fetch' | 'axios' | 'python'

export function CodeGeneratorPanel({ request }: CodeGeneratorPanelProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('curl')
  const [copied, setCopied] = useState(false)

  const generatedCode = generateAllCode(request)
  const currentCode = generatedCode[selectedLanguage]

  function handleCopy() {
    navigator.clipboard.writeText(currentCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="code-generator-panel">
      <div className="code-tabs-header">
        <div className="code-tabs">
          {(['curl', 'fetch', 'axios', 'python'] as CodeLanguage[]).map((lang) => (
            <button
              key={lang}
              className={`code-tab ${selectedLanguage === lang ? 'active' : ''}`}
              onClick={() => setSelectedLanguage(lang)}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          className={`copy-button ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      <pre className="code-block">
        <code>{currentCode}</code>
      </pre>
    </div>
  )
}
