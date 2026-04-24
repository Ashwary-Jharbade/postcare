import { useState } from 'react'
import { type RequestRecord } from '../../domain/models'
import { generateAiSuggestions, type AiSuggestionResult } from '../../lib/ai/requestAssistant'
import './AiAssistPanel.css'

interface AiAssistPanelProps {
  request: RequestRecord
}

export function AiAssistPanel({ request }: AiAssistPanelProps) {
  const [result, setResult] = useState<AiSuggestionResult | null>(null)

  return (
    <div className="ai-assist-panel">
      <div className="section-header">
        <h3>AI Assistant</h3>
        <button
          className="ghost-button"
          onClick={() => setResult(generateAiSuggestions(request))}
          type="button"
        >
          Generate suggestions
        </button>
      </div>

      <p className="subtle">
        Suggestions are generated locally with request redaction safeguards before analysis.
      </p>

      {result && (
        <div className="ai-results" role="status" aria-live="polite">
          <div className="ai-redaction-preview">
            <h4>Redacted request preview</h4>
            <pre>
              <code>{JSON.stringify(result.redactedRequest, null, 2)}</code>
            </pre>
          </div>
          <div className="ai-suggestion-list">
            {result.suggestions.map((suggestion) => (
              <article key={suggestion.id} className="ai-suggestion-card">
                <p className="ai-suggestion-category">{suggestion.category}</p>
                <h4>{suggestion.title}</h4>
                <p>{suggestion.detail}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
