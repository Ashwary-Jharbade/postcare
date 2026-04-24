import { type EnvironmentRecord } from '../../domain/models'
import { validateVariables } from '../../lib/variables/substitution'
import './VariableInfo.css'

interface FieldEntry {
  key: string
  value: string
  enabled?: boolean
}

interface VariableInfoProps {
  url: string
  headers: FieldEntry[]
  queryParams: FieldEntry[]
  body: string
  environment: EnvironmentRecord | null | undefined
}

export function VariableInfo({
  url,
  headers,
  queryParams,
  body,
  environment,
}: VariableInfoProps) {
  const validation = validateVariables(url, headers, queryParams, body, environment)

  if (validation.missingVariables.length === 0) {
    return null
  }

  const allVariables = url + headers.map((h) => h.key + h.value).join('') + queryParams.map((p) => p.key + p.value).join('') + body
  const hasVariables = /\{\{/.test(allVariables)

  if (!hasVariables && validation.missingVariables.length === 0) {
    return null
  }

  return (
    <div className="variable-info">
      {validation.missingVariables.length > 0 && (
        <div className="variable-warning">
          <strong>⚠️ Missing Variables:</strong>
          <ul>
            {validation.missingVariables.map((varName) => (
              <li key={varName}>{varName}</li>
            ))}
          </ul>
          <p className="variable-hint">
            Define these variables in your active environment to enable substitution.
          </p>
        </div>
      )}
    </div>
  )
}
