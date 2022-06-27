"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createASTNUnmarshaller = void 0;
const pr = __importStar(require("pareto-runtime"));
function createASTNUnmarshaller($p, createBodyTreeParser, createTreeUnmarshaller, createExternalSchemaLoader) {
    function onUnmarshallError(error, annotation, severity) {
        $p.handler.onUnmarshallError({
            type: error,
            annotation: annotation,
            severity: severity,
        });
    }
    let internalParser = null;
    function createRealParser($) {
        return createBodyTreeParser(createTreeUnmarshaller({
            specification: $.specification,
            schemaAndSideEffects: $.schemaAndSideEffects,
            onError: (error, annotation, severity) => {
                onUnmarshallError(["unmarshall", error], annotation, severity);
            },
        }));
    }
    function createQueueingParser(annotation) {
        const queue = [];
        let endAnnotation = null;
        let downStream = null;
        return {
            annotation: annotation,
            setDownstream: (parser2) => {
                downStream = parser2;
                queue.forEach(($) => {
                    parser2.onToken($);
                });
                if (endAnnotation !== null) {
                    parser2.onEnd(endAnnotation);
                }
            },
            parser: {
                onEnd: ($) => {
                    if (downStream !== null) {
                        downStream.onEnd($);
                    }
                    endAnnotation = $;
                },
                onToken: (token) => {
                    if (downStream !== null) {
                        downStream.onToken(token);
                    }
                    queue.push(token);
                },
            },
        };
    }
    return {
        onNoInternalSchema: () => { },
        onEmbeddedSchema: ($$) => {
            const qp = createQueueingParser($$.headerAnnotation);
            internalParser = qp;
            const schemaSchemaBuilder = $p.handler.getInternalSchemaSchemaBuilder($$.schemaSchemaReferenceToken.token.value);
            if (schemaSchemaBuilder === null) {
                throw new Error(`IMPLEMENT ME: unknown schema schema: ${$$.schemaSchemaReferenceToken.token.value}`);
            }
            return schemaSchemaBuilder((error, annotation) => {
                onUnmarshallError(["embedded schema error", error], annotation, ["error", {}]);
            }, (schemaAndSideEffects) => {
                const rp = createRealParser({
                    specification: ["embedded", {}],
                    schemaAndSideEffects: schemaAndSideEffects,
                });
                qp.setDownstream(rp);
            });
        },
        onSchemaReference: ($$) => {
            const qp = createQueueingParser($$.headerAnnotation);
            internalParser = qp;
            $p.handler.referencedSchemaProvider.getResource($$.token.token.value, createExternalSchemaLoader({
                onFailed: () => { },
                onSucces: (schemaAndSideEffects) => {
                    const rp = createRealParser({
                        schemaAndSideEffects: schemaAndSideEffects,
                        specification: ["reference", {
                                name: $$.token.token.value,
                            }],
                    });
                    qp.setDownstream(rp);
                },
            }), (error) => {
                switch (error[0]) {
                    case "not found": {
                        $p.handler.onUnmarshallError({
                            type: ["schema not found", {}],
                            annotation: $$.token.annotation,
                            severity: ["error", {}],
                        });
                        break;
                    }
                    case "other": {
                        const $ = error[1];
                        $p.handler.onUnmarshallError({
                            type: ["loading error", {
                                    message: `problems loading schema: ${$.description}`,
                                }],
                            annotation: $$.token.annotation,
                            severity: ["error", {}],
                        });
                        break;
                    }
                    default:
                        pr.au(error[0]);
                }
            });
        },
        onBody: () => {
            function createDummyParser() {
                return createBodyTreeParser(//logs errors
                null);
            }
            switch ($p.handler.contextSchema[0]) {
                case "available": {
                    if (internalParser !== null) {
                        onUnmarshallError(["found both internal and context schema. ignoring internal schema", {}], internalParser.annotation, ["warning", {}]);
                    }
                    return pr.cc($p.handler.contextSchema[1], ($) => {
                        const rp2 = createRealParser({
                            schemaAndSideEffects: $,
                            specification: ["none", {}],
                        });
                        return {
                            onToken: (token) => {
                                return rp2.onToken(token);
                            },
                            onEnd: (endAnnotation) => {
                                rp2.onEnd(endAnnotation);
                            },
                        };
                    });
                }
                case "has errors": {
                    return createDummyParser();
                }
                case "ignored": {
                    return pr.cc($p.handler.contextSchema[1], ($) => {
                        if (internalParser === null) {
                            onUnmarshallError(["no schema", {}], null, ["error", {}]);
                            return createDummyParser();
                        }
                        else {
                            const ip = internalParser;
                            return {
                                onToken: (token) => {
                                    return ip.parser.onToken(token);
                                },
                                onEnd: (endAnnotation) => {
                                    ip.parser.onEnd(endAnnotation);
                                },
                            };
                        }
                    });
                }
                case "not available":
                    return pr.cc($p.handler.contextSchema[1], ($) => {
                        if (internalParser === null) {
                            onUnmarshallError(["no schema", {}], null, ["error", {}]);
                            return createDummyParser();
                        }
                        else {
                            const ip = internalParser;
                            return {
                                onToken: (token) => {
                                    return ip.parser.onToken(token);
                                },
                                onEnd: (endAnnotation) => {
                                    ip.parser.onEnd(endAnnotation);
                                },
                            };
                        }
                    });
                default:
                    return pr.au($p.handler.contextSchema[0]);
            }
        },
        // errors: {
        //     onError: ($$) => {
        //         onUnmarshallError(["parsing", $$.error], $$.annotation, ["error", {}])
        //     },
        // },
    };
}
exports.createASTNUnmarshaller = createASTNUnmarshaller;
