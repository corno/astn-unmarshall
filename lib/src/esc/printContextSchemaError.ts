import * as pr from "pareto-runtime"

import { ContextSchemaIssue } from "../../interface/interfaces/ContextSchemaIssue"

export function printContextSchemaIssue($: ContextSchemaIssue): string {
	switch ($.type[0]) {
		case "validating schema file against internal schema": {
			return "validating schema file against internal schema"
		}
        case "loading error": {
            const $$$$ = $.type[1]
            return $$$$.message
        }
		default:
			return pr.au($.type[0])
	}
}
