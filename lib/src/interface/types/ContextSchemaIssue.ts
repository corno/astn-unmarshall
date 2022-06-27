import { DiagnosticSeverity } from "astn-unmarshall-api"

export type ContextSchemaIssue = {
    type:
    | ["validating schema file against internal schema", {}]
    | ["loading error", {
        message: string
    }]
    severity: DiagnosticSeverity
}