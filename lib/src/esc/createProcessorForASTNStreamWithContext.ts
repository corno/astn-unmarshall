import * as pr from "pareto-runtime"

import { IResourceProvider } from "astn-unmarshall-api"
import { ContextSchemaIssue } from "../../interface/interfaces/ContextSchemaIssue"
import { ContextSchemaResult } from "../../interface/interfaces/ContextSchemaResult"
import { IStructureTokenConsumer } from "astn-tokenconsumer-api"
import { CreateExternalSchemaLoader } from "../../interface/interfaces/CreateExternalSchemaLoader"

export type CreateStructureParserX<EventAnnotation> = (
    contextSchema: ContextSchemaResult<EventAnnotation>
) => IStructureTokenConsumer<EventAnnotation>


export function createProcessorForASTNStreamWithContext<EventAnnotation>(
    $: {
        schemaFileName: string
        serializedDatasetBaseName: string
    },
    $p: {
        contextSchemaProvider: IResourceProvider
        onContextSchemaIssue: ($: ContextSchemaIssue) => void
        fixmeOnResult: ($: IStructureTokenConsumer<EventAnnotation>) => void //FIXME: this is not a proper callback, its parameter is a interface instead of a datatype
    },
    createExternalSchemaLoader: CreateExternalSchemaLoader<EventAnnotation>,
    createStructureParser: CreateStructureParserX<EventAnnotation>,
): void {
    const onResult = (contextSchema: ContextSchemaResult<EventAnnotation>) => {
        $p.fixmeOnResult(
            createStructureParser(
                contextSchema,
            )
        )
    }
    if ($.serializedDatasetBaseName === $.schemaFileName) {
        //don't validate the schema against itself
        $p.onContextSchemaIssue({
            type: ["validating schema file against internal schema", {}],
            severity: ["warning", {}],
        })
        onResult(["ignored", {}])
    } else {
        $p.contextSchemaProvider.getResource(
            $.schemaFileName,
            createExternalSchemaLoader({
                onFailed: () => {
                    onResult(["has errors", {}])
                },
                onSucces: (schema) => {
                    onResult(["available", schema])
                },
            }),
            (error) => {
                switch (error[0]) {
                    case "not found": {
                        //this is okay, the context schema is optional
                        onResult(["not available", {}])
                        break
                    }
                    case "other": {
                        const $ = error[1]
                        $p.onContextSchemaIssue({
                            type: ["loading error", {
                                message: `problems loading schema: ${$.description}`,
                            }],
                            severity: ["error", {}],
                        })
                        onResult(["has errors", {}])
                        break
                    }
                    default:
                        pr.au(error[0])
                }
            },
        )
    }
}