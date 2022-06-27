import * as pr from "pareto-runtime"

import { printSchemaDeserializationError } from "./printSchemaDeserializationError"
import * as u from "astn-unmarshall-api"

export function printASTNUnmarshallError(
    $: u.ASTNUnmarshallIssueType,
    printUnmarshallError: ($: u.UnmarshallError) => string
): string {
    switch ($[0]) {
        case "unmarshall": {
            const $$ = $[1]
            return printUnmarshallError($$)
        }
        case "embedded schema error": {
            const $$ = $[1]
            return printSchemaDeserializationError($$)
        }
        case "found both internal and context schema. ignoring internal schema": {
            return `found both internal and context schema. ignoring internal schema`
        }
        case "invalid embedded schema": {
            return $[0]
        }
        case "no schema": {
            return "no schema found"
        }
        case "invalid schema reference": {
            return $[0]
        }
        case "loading error": {
            const $$$$ = $[1]
            return $$$$.message
        }
        case "schema not found": {
            return `schema not found`
        }
        default:
            return pr.au($[0])
    }
}
