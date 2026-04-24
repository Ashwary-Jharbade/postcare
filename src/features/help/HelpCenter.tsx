import { useEffect, useMemo, useState } from 'react'
import './HelpCenter.css'

interface HelpCenterProps {
  open: boolean
  onClose: () => void
}

interface HelpFeature {
  id: string
  title: string
  description: string
  steps: string[]
}

const HELP_FEATURES: HelpFeature[] = [
  {
    id: 'collections',
    title: 'Collections',
    description: 'Collections organize requests into reusable groups for each API workflow.',
    steps: [
      'Use the left Collections panel to create a new collection.',
      'Select a collection to load its request list.',
      'Rename or delete collections from collection actions.',
      'Keep one collection per API domain for cleaner navigation.',
    ],
  },
  {
    id: 'requests',
    title: 'Request Composer',
    description: 'The Request Composer is where you build, edit, and save HTTP requests.',
    steps: [
      'Select a collection and then choose a request in the Request list.',
      'Set method, URL, query params, headers, body mode, and body content.',
      'Configure auth mode and credentials in the Auth section.',
      'Changes are auto-saved to local IndexedDB storage.',
    ],
  },
  {
    id: 'environments',
    title: 'Environments',
    description: 'Environments let you switch between variable sets like local, staging, and production.',
    steps: [
      'Open the Environments tab in the left sidebar.',
      'Click the + button at the top-right of the sidebar to create a new environment.',
      'Enter a name (e.g., "Staging") and pick a color, then click Create.',
      'Click an environment name in the list to set it as the active environment.',
      'The active environment is shown with a green "active" badge and in the top-right "Active environment" indicator.',
      'To edit variables, select an environment, then click "Show environment variables" in the toolbar above the main panel.',
      'The variables editor panel will appear on the right side of the workspace.',
      'Click + in the variables editor header to add a new variable.',
      'Enter a key (e.g., "baseUrl"), a value (e.g., "https://api.staging.com"), and optionally mark it as Secret.',
      'Click Add to save the variable. It will appear immediately in the variable list below.',
      'To delete a variable, click the ✕ button next to it.',
      'Use separate environments per API stage (local, staging, production) to avoid accidental production calls.',
    ],
  },
  {
    id: 'variables',
    title: 'Variable Substitution',
    description: 'Variable placeholders are replaced from the active environment at execution time.',
    steps: [
      'Define variables in your active environment (e.g., key: "baseUrl", value: "https://api.example.com").',
      'In the request URL, use the syntax {{baseUrl}} — for example: {{baseUrl}}/users.',
      'You can also use {{variableName}} in headers, query param values, and the request body.',
      'Open the "Variable Info" section below the Body editor to see which variables are detected and whether they resolve.',
      'Green variables are resolved from the active environment; red/missing ones indicate a mismatch.',
      'Ensure the active environment has all referenced variable keys before sending the request.',
      'Secret variables (marked with 🔒) are substituted the same way but their values are hidden in the UI.',
      'To test the same request across environments, switch the active environment in the sidebar and re-send.',
    ],
  },
  {
    id: 'execution',
    title: 'Request Execution',
    description: 'Execution sends the current request and stores run history locally.',
    steps: [
      'Click `Send request` in the Execution section.',
      'Wait for status update in the Response section.',
      'Review status code, duration, headers, and response body.',
      'Execution outcomes are persisted in local request history.',
    ],
  },
  {
    id: 'response-viewer',
    title: 'Response Viewer Tabs',
    description: 'Response Viewer provides pretty, raw, and HTML preview tabs for result inspection.',
    steps: [
      'Send a request to populate the response panel.',
      'Switch tabs to view formatted JSON, raw payload, or HTML preview.',
      'Use status and timing metadata to compare runtime behavior.',
      'Use raw view when debugging malformed payload issues.',
    ],
  },
  {
    id: 'simulation',
    title: 'Mock Simulation',
    description: 'Simulation modes allow delay, failure, and edge-case testing without real backend changes.',
    steps: [
      'Choose a simulation mode from the Execution controls.',
      'Optionally set mock delay and status code.',
      'Run request and inspect response behavior in viewer and diagnostics.',
      'Use timeout or malformed-json mode to test client error handling.',
    ],
  },
  {
    id: 'diagnostics',
    title: 'Diagnostics & Tracing',
    description: 'Diagnostics capture trace IDs, execution summaries, and step logs for troubleshooting.',
    steps: [
      'Run a request to generate a trace entry.',
      'Open Diagnostics section to view severity, status, size, and duration.',
      'Inspect execution log stages for start, prepared, response, and error events.',
      'Use `Clear` to reset diagnostics when starting a new debug session.',
    ],
  },
  {
    id: 'comparison',
    title: 'Response Comparison',
    description: 'Comparison highlights differences across environments for headers, payload, and JSON shape.',
    steps: [
      'Run comparison across selected environments.',
      'Use side-by-side mode for per-environment response cards.',
      'Check header diff counts and removed header indicators.',
      'Use payload and JSON structure diff blocks to inspect regressions.',
    ],
  },
  {
    id: 'codegen',
    title: 'Code Generator',
    description: 'Code Generator exports runnable examples for common clients.',
    steps: [
      'Open Code Generator section in the composer.',
      'Choose one of cURL, fetch, axios, or Python output formats.',
      'Review generated snippet for endpoint and auth correctness.',
      'Use generated output as a quick integration starting point.',
    ],
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    description: 'AI Assistant provides local, redaction-safe request improvement and edge-case suggestions.',
    steps: [
      'Open the AI Assistant section and click `Generate suggestions`.',
      'Review the redacted request preview shown above suggestions.',
      'Apply useful recommendations manually in the composer.',
      'Keep sensitive values in environment secrets and never raw prompt text.',
    ],
  },
  {
    id: 'import-export',
    title: 'Import & Export',
    description: 'Import and export move collections and requests between machines safely.',
    steps: [
      'Use collection import to load saved request bundles.',
      'Use export to back up selected collections locally.',
      'Validate imported collections before running production targets.',
      'Do not export files containing plaintext secret values.',
    ],
  },
  {
    id: 'offline-pwa',
    title: 'Offline & Install',
    description: 'Postcare includes an installable PWA shell with service worker cache support.',
    steps: [
      'Open app in a supported browser and install from browser UI.',
      'Launch installed app from OS app list for standalone experience.',
      'Use online mode first to cache shell resources.',
      'If offline, cached shell loads and falls back to root route behavior.',
    ],
  },
]

export function HelpCenter({ open, onClose }: HelpCenterProps) {
  const [activeFeatureId, setActiveFeatureId] = useState(HELP_FEATURES[0]?.id ?? 'collections')

  const activeFeature = useMemo(
    () => HELP_FEATURES.find((feature) => feature.id === activeFeatureId) ?? HELP_FEATURES[0],
    [activeFeatureId],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    function onKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="help-overlay" role="dialog" aria-modal="true" aria-label="Postcare help center">
      <div className="help-container">
        <div className="help-header">
          <div>
            <h2>Help Center</h2>
            <p>Browse features and follow recommended usage steps.</p>
          </div>
          <button className="help-close-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="help-layout">
          <aside className="help-sidebar" aria-label="Feature list">
            <div className="help-tablist" role="tablist" aria-orientation="vertical">
              {HELP_FEATURES.map((feature) => {
                const selected = feature.id === activeFeature?.id
                return (
                  <button
                    key={feature.id}
                    role="tab"
                    type="button"
                    aria-selected={selected}
                    className={`help-tab ${selected ? 'help-tab-active' : ''}`}
                    onClick={() => setActiveFeatureId(feature.id)}
                  >
                    {feature.title}
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="help-content" role="tabpanel" aria-label={activeFeature?.title ?? 'Help feature'}>
            <h3>{activeFeature?.title}</h3>
            <p>{activeFeature?.description}</p>
            <h4>Usage Steps</h4>
            <ol>
              {activeFeature?.steps.map((step, index) => (
                <li key={`${activeFeature.id}-step-${index}`}>{step}</li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}
