import { SchemaSchemaBuilder } from "astn-typedtreehandler-api"
import { createSchemaHandler } from "./createSchemaHandler"
import { IStreamConsumer } from "pareto-runtime"
import { TokenizerAnnotationData } from "astn-tokenizer-lib"
import { ISchemaAndSideEffects } from "astn-typedtreehandler-api"
import { CreateLoggingTokenizer } from "../../../astn/interface/interfaces/CreateTokenizer"
import { CreateStructureParser } from "../../../astn/interface/interfaces/CreateStructureParser"
import { CreateTreeParserAndHandleErrors } from "../../../astn/interface/interfaces/CreateTreeParser"
import { ITreeHandler } from "astn-handlers-api"

export type ExternalSchemaCreaters<BodyEventAnnotation> = {
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<TokenizerAnnotationData, BodyEventAnnotation> | null
    createTokenizer: CreateLoggingTokenizer
    createStructureParser: CreateStructureParser<TokenizerAnnotationData>
    createTreeParser: CreateTreeParserAndHandleErrors<TokenizerAnnotationData>
    createDummyTreeHandler: () => ITreeHandler<TokenizerAnnotationData>
    createLoggingTreeParser: CreateTreeParserAndHandleErrors<TokenizerAnnotationData>
    onError: ($: {}
    ) => void
}

export function createExternalSchemaLoader<EventAnnotation>($p: {
    onFailed: () => void
    onSucces: ($: ISchemaAndSideEffects<EventAnnotation>) => void
    $c: ExternalSchemaCreaters<EventAnnotation>
}): IStreamConsumer<string, null> {
    let foundErrors = false
    let schema: ISchemaAndSideEffects<EventAnnotation> | null = null
    const spt = $p.$c.createTokenizer({
        parser: $p.$c.createStructureParser(
            createSchemaHandler(
                $p.$c.getSchemaSchemaBuilder,
                () => {
                    foundErrors = true
                    //console.error("SCHEMA ERROR", error)
                },
                ($) => {
                    schema = $
                },
                ($) => {
                    return $p.$c.createLoggingTreeParser({
                        handler: $,
                        onError: () => {
                            foundErrors = true
                        },
                    })
                },
                $p.$c.createDummyTreeHandler,
            )
        ),
        onError: (_error) => {
            foundErrors = true
        },
    })
    return {
        onData: ($) => {
            spt.onData($)
        },
        onEnd: () => {
            spt.onEnd(null)
            if (schema === null) {
                if (!foundErrors) {
                    throw new Error("no schema and no errors")
                }
                $p.$c.onError(["errors in external schema", {}])
                $p.onFailed()
            } else {
                $p.onSucces(schema)
            }
        },
    }
}