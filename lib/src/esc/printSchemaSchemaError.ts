import * as pr from "pareto-runtime"

import { SchemaError } from "../../interface/types/SchemaError"
import { printSchemaDeserializationError } from "./printSchemaDeserializationError"

export function printSchemaSchemaError($$: SchemaError): string {
    switch ($$[0]) {
        case "missing schema schema definition": {
            //const $$$ = $$[1]
            return `missing schema schema definition`
        }
        case "schema processing": {
            const $$$ = $$[1]
            return printSchemaDeserializationError($$$)
        }
        case "schema schema cannot be embedded": {
            return "schema schema cannot be embedded"
        }
        case "unknown schema schema": {
            //const $$$ = $$[1]
            return `unknown schema schema`
        }
        default:
            return pr.au($$[0])
    }
}
