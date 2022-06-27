import * as pr from "pareto-runtime"

import { SchemaDeserializationError } from "astn-typedtreehandler-api"

import { printExpectIssue } from "../../../astn/esc/implementation/printExpectIssue"

export function printSchemaDeserializationError(error: SchemaDeserializationError): string {
    switch (error[0]) {
        case "expect": {
            const $$$ = error[1]
            return printExpectIssue($$$)
        }
        case "validation": {
            const $$$ = error[1]
            return $$$.message
        }
        default:
            return pr.au(error[0])
    }
}