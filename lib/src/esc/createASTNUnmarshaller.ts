import * as pl from "pareto-lib-core"

import * as api from "astn-unmarshall-api"
import { SchemaSchemaBuilder } from "astn-typedtreehandler-api"

import { IContentTokenConsumer } from "astn-tokenconsumer-api"

import * as ap from "astn-tokenconsumer-api"

import { IStructureHandler } from "astn-handlers-api"
import * as inf from "../interface"
import * as typedTokenize from "astn-typedtreehandler-api"

export function createASTNUnmarshaller<EventAnnotation>(
    $p: {
        handler: {
            contextSchema: api.ContextSchemaResult<EventAnnotation>
            referencedSchemaProvider: api.IResourceProvider
            onUnmarshallError: ($: api.ASTNUnmarshallIssue<EventAnnotation>) => void
            getInternalSchemaSchemaBuilder: (
                name: string,
            ) => SchemaSchemaBuilder<EventAnnotation, EventAnnotation> | null
        }
    },
    createBodyTreeParser: inf.CreateTreeParser<EventAnnotation>,
    createTreeUnmarshaller: inf.CreateTreeUnmarshaller2<EventAnnotation>,
    createExternalSchemaLoader: inf.CreateExternalSchemaLoader<EventAnnotation>,
): IStructureHandler<EventAnnotation> {

    function onUnmarshallError(
        error: api.ASTNUnmarshallIssueType,
        annotation: EventAnnotation | null,
        severity: api.DiagnosticSeverity
    ) {
        $p.handler.onUnmarshallError({
            type: error,
            annotation: annotation,
            severity: severity,
        })
    }
    let internalParser: QueueingParser | null = null
    function createRealParser($: {
        specification: inf.InternalSchemaSpecification
        schemaAndSideEffects: typedTokenize.ISchemaAndSideEffects<EventAnnotation>
    }): IContentTokenConsumer<EventAnnotation> {
        return createBodyTreeParser(
            createTreeUnmarshaller({
                specification: $.specification,
                schemaAndSideEffects: $.schemaAndSideEffects,
                onError: (error, annotation, severity) => {
                    onUnmarshallError(["unmarshall", error], annotation, severity)
                },
            }),
        )
    }

    type QueueingParser = {
        annotation: EventAnnotation
        setDownstream: (parser: IContentTokenConsumer<EventAnnotation>) => void
        parser: IContentTokenConsumer<EventAnnotation>
    }
    function createQueueingParser(
        annotation: EventAnnotation
    ): QueueingParser {
        const queue: ap.AnnotatedToken<ap.ContentToken, EventAnnotation>[] = []
        let endAnnotation: null | EventAnnotation = null
        let downStream: IContentTokenConsumer<EventAnnotation> | null = null
        return {
            annotation: annotation,
            setDownstream: (parser2) => {
                downStream = parser2
                queue.forEach(($) => {
                    parser2.onToken($)
                })
                if (endAnnotation !== null) {
                    parser2.onEnd(endAnnotation)
                }
            },
            parser: {
                onEnd: ($) => {
                    if (downStream !== null) {
                        downStream.onEnd($)
                    }
                    endAnnotation = $
                },
                onToken: (token) => {
                    if (downStream !== null) {
                        downStream.onToken(token)
                    }
                    queue.push(token)
                },
            },
        }
    }

    return {
        onNoInternalSchema: () => { },
        onEmbeddedSchema: ($$) => {
            const qp = createQueueingParser($$.headerAnnotation)
            internalParser = qp


            const schemaSchemaBuilder = $p.handler.getInternalSchemaSchemaBuilder($$.schemaSchemaReferenceToken.token.value)

            if (schemaSchemaBuilder === null) {
                throw new Error(`IMPLEMENT ME: unknown schema schema: ${$$.schemaSchemaReferenceToken.token.value}`)
            }
            return schemaSchemaBuilder(
                (error, annotation) => {
                    onUnmarshallError(["embedded schema error", error], annotation, ["error", {}])

                },
                (schemaAndSideEffects) => {

                    const rp = createRealParser({
                        specification: ["embedded", {}],
                        schemaAndSideEffects: schemaAndSideEffects,
                    })
                    qp.setDownstream(rp)
                }
            )
        },
        onSchemaReference: ($$) => {
            const qp = createQueueingParser($$.headerAnnotation)
            internalParser = qp
            $p.handler.referencedSchemaProvider.getResource(
                $$.token.token.value,
                createExternalSchemaLoader({
                    onFailed: () => { },
                    onSucces: (schemaAndSideEffects) => {
                        const rp = createRealParser(
                            {
                                schemaAndSideEffects: schemaAndSideEffects,
                                specification: ["reference", {
                                    name: $$.token.token.value,
                                }],
                            }
                        )
                        qp.setDownstream(rp)

                    },
                }),
                (error) => {
                    switch (error[0]) {
                        case "not found": {
                            $p.handler.onUnmarshallError({
                                type: ["schema not found", {}],
                                annotation: $$.token.annotation,
                                severity: ["error", {}],
                            })
                            break
                        }
                        case "other": {
                            const $ = error[1]
                            $p.handler.onUnmarshallError({
                                type: ["loading error", {
                                    message: `problems loading schema: ${$.description}`,
                                }],
                                annotation: $$.token.annotation,
                                severity: ["error", {}],
                            })
                            break
                        }
                        default:
                            pl.au(error[0])
                    }
                },
            )
        },
        onBody: () => {
            function createDummyParser(
            ): IContentTokenConsumer<EventAnnotation> {
                return createBodyTreeParser( //logs errors
                    null,
                )
            }
            switch ($p.handler.contextSchema[0]) {
                case "available": {
                    if (internalParser !== null) {
                        onUnmarshallError(
                            ["found both internal and context schema. ignoring internal schema", {}],
                            internalParser.annotation,
                            ["warning", {}]
                        )
                    }
                    return pl.cc($p.handler.contextSchema[1], ($) => {
                        const rp2 = createRealParser(
                            {
                                schemaAndSideEffects: $,
                                specification: ["none", {}],
                            }
                        )
                        return {
                            onToken: (token) => {
                                return rp2.onToken(token)
                            },
                            onEnd: (endAnnotation) => {
                                rp2.onEnd(endAnnotation)
                            },
                        }
                    })
                }
                case "has errors": {
                    return createDummyParser()
                }
                case "ignored": {
                    return pl.cc($p.handler.contextSchema[1], ($) => {
                        if (internalParser === null) {
                            onUnmarshallError(
                                ["no schema", {}],
                                null,
                                ["error", {}],
                            )
                            return createDummyParser()
                        } else {
                            const ip = internalParser

                            return {
                                onToken: (token) => {
                                    return ip.parser.onToken(token)
                                },
                                onEnd: (endAnnotation) => {
                                    ip.parser.onEnd(endAnnotation)
                                },
                            }
                        }
                    })
                }
                case "not available":
                    return pl.cc($p.handler.contextSchema[1], ($) => {
                        if (internalParser === null) {
                            onUnmarshallError(
                                ["no schema", {}],
                                null,
                                ["error", {}],
                            )
                            return createDummyParser()
                        } else {
                            const ip = internalParser
                            return {
                                onToken: (token) => {
                                    return ip.parser.onToken(token)
                                },
                                onEnd: (endAnnotation) => {
                                    ip.parser.onEnd(endAnnotation)
                                },
                            }
                        }
                    })
                default:
                    return pl.au($p.handler.contextSchema[0])
            }
        },
        // errors: {
        //     onError: ($$) => {
        //         onUnmarshallError(["parsing", $$.error], $$.annotation, ["error", {}])
        //     },
        // },
    }
}
