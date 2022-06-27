/* eslint
    "@typescript-eslint/no-shadow": "off"
 */
import * as pr from "pareto-runtime"
import { GroupDefinition, OptionDefinition, TaggedUnionDefinition, ValueDefinition } from "astn-typedtreehandler-api"
import * as inf from "astn-unmarshall-api"
import * as typed from "astn-typedtreehandler-api"
import * as th from "astn-handlers-api"


export type ValueContext<EventAnnotation> = {
    definition: typed.ValueDefinition
    handler: typed.ITypedValueHandler<EventAnnotation>
}

export type IShorthandParsingState<EventAnnotation> = {
    wrapup(
        annotation: EventAnnotation,
        onError: (message: inf.UnmarshallError, annotation: EventAnnotation, severity: inf.DiagnosticSeverity) => void
    ): void
    findNextValue(): ValueContext<EventAnnotation> | null
    pushGroup(
        definition: typed.GroupDefinition,
        handler: typed.ITypedValueHandler<EventAnnotation>
    ): void
    pushTaggedUnion(
        definition: typed.OptionDefinition,
        taggedUnionHandler: typed.ITypedTaggedUnionHandler<EventAnnotation>,
        optionHandler: typed.ITypedValueHandler<EventAnnotation>,
    ): void
}

type OptionContext<EventAnnotation> = {
    definition: typed.OptionDefinition
    optionHandler: typed.ITypedValueHandler<EventAnnotation>
    taggedUnionHandler: typed.ITypedTaggedUnionHandler<EventAnnotation>
}

type PropertyContext<EventAnnotation> = {
    name: string
    definition: typed.ValueDefinition
    handler: typed.IGroupHandler<EventAnnotation>
}

type ExpectedElements<EventAnnotation> = PropertyContext<EventAnnotation>[]

type GroupContext<EventAnnotation> = {
    isOuterGroup: boolean
    elements: ExpectedElements<EventAnnotation>
    handler: typed.IGroupHandler<EventAnnotation>
    index: number
}

function createGroupContext<EventAnnotation>(
    definition: typed.GroupDefinition,
    isOuterGroup: boolean,
    subHandler: typed.IGroupHandler<EventAnnotation>,
): Context<EventAnnotation> {
    const expectedElements: ExpectedElements<EventAnnotation> = []
    definition.properties.forEach((propDefinition, propKey) => {
        expectedElements.push({
            name: propKey,
            handler: subHandler,
            definition: propDefinition.value,
        })
    })
    return ["group", {
        elements: expectedElements,
        isOuterGroup: isOuterGroup,
        handler: subHandler,
        index: 0,
    }]
}

type Context<EventAnnotation> =
    | ["group", GroupContext<EventAnnotation>]
//FIXME move option context here so tagged union onEnd can be called

type StateImp<EventAnnotation> = {
    stack: Context<EventAnnotation>[]
    currentContext: Context<EventAnnotation>
    optionContext: null | OptionContext<EventAnnotation>
}

function createShorthandParsingState<EventAnnotation>(
    groupDefinition: typed.GroupDefinition,
    groupHandler: typed.IGroupHandler<EventAnnotation>,

): IShorthandParsingState<EventAnnotation> {
    const stateImp: StateImp<EventAnnotation> = {
        stack: [],
        currentContext: createGroupContext(
            groupDefinition,
            true,
            groupHandler
        ),
        optionContext: null,
    }
    return {
        pushTaggedUnion: (definition, taggedUnionHandler, optionHandler) => {
            stateImp.optionContext = {
                definition: definition,
                taggedUnionHandler: taggedUnionHandler,
                optionHandler: optionHandler,
            }
        },
        pushGroup: (definition, handler) => {
            stateImp.stack.push(stateImp.currentContext)
            stateImp.currentContext = createGroupContext(
                definition,
                false,
                handler.onGroup({
                    type: ["mixin", {}],
                    definition: definition,
                }),
            )
        },
        wrapup: (annotation, onError) => {
            function wrapupImp(state: StateImp<EventAnnotation>) {
                if (stateImp.optionContext !== null) {
                    defaultInitializeValue(
                        stateImp.optionContext.definition.value,
                        stateImp.optionContext.optionHandler,
                        onError,
                    )
                    stateImp.optionContext = null
                }
                switch (state.currentContext[0]) {
                    case "group":
                        const $ = state.currentContext[1]
                        const missing = $.elements.length - $.index
                        if (missing > 0) {
                            onError(
                                ["missing elements", { elements: $.elements.slice($.index).map((ee) => ee.name) }],
                                annotation,
                                ["error", {}],
                            )
                            for (let x = $.index; x !== $.elements.length; x += 1) {
                                const ee = pr.getElement($.elements, x)

                                defaultInitializeValue(
                                    ee.definition,
                                    ee.handler.onProperty({
                                        key: ee.name,
                                        token: null,
                                        definition: ee.definition,
                                    }),
                                    onError,
                                )
                            }
                        }
                        $.handler.onClose({
                            token: $.isOuterGroup
                                ? {
                                    token: {},
                                    annotation: annotation,
                                }
                                : null,
                        })
                        break
                    default:
                        pr.au(state.currentContext[0])
                }
                const previousContext = state.stack.pop()
                if (previousContext !== undefined) {
                    state.currentContext = previousContext
                    wrapupImp(state)
                }
            }
            wrapupImp(stateImp)
        },
        findNextValue: () => {
            function findNextValueImp(): null | ValueContext<EventAnnotation> {
                if (stateImp.optionContext !== null) {
                    const tmp = stateImp.optionContext
                    stateImp.optionContext = null
                    return {
                        definition: tmp.definition.value,
                        handler: tmp.optionHandler,

                    }
                }
                switch (stateImp.currentContext[0]) {
                    case "group":
                        const $ = stateImp.currentContext[1]
                        const ee = pr.getElement($.elements, $.index)
                        $.index++
                        if (ee !== undefined) {
                            return {
                                definition: ee.definition,
                                handler: ee.handler.onProperty({
                                    token: null,
                                    key: ee.name,
                                    definition: ee.definition,
                                }),
                            }
                        } else {
                            //end of array of properties
                            $.handler.onClose({
                                token: null,
                            })
                            const previousContext = stateImp.stack.pop()
                            if (previousContext === undefined) {
                                return null
                            } else {
                                stateImp.currentContext = previousContext
                                return findNextValueImp()
                            }
                        }
                    default:
                        return pr.au(stateImp.currentContext[0])
                }
            }
            return findNextValueImp()
        },
    }
}

type OnError<EventAnnotation> = (message: inf.UnmarshallError, annotation: EventAnnotation, severity: inf.DiagnosticSeverity) => void

function wrap<EventAnnotation>(
    handler: th.IValueHandler<EventAnnotation>,
    onMissing: () => void,
): th.IRequiredValueHandler<EventAnnotation> {
    return {
        exists: handler,
        missing: (): void => {
            onMissing()
        },
    }
}

function createUnexpectedArrayHandler<EventAnnotation>(
    message: inf.UnmarshallError,
    annotation: EventAnnotation,
    onError: OnError<EventAnnotation>,
    dummyHandlers: DummyHandlers<EventAnnotation>,
): th.IArrayHandler<EventAnnotation> {
    onError(message, annotation, ["error", {}])
    return dummyHandlers.array()
}

function createUnexpectedObjectHandler<EventAnnotation>(
    message: inf.UnmarshallError,
    annotation: EventAnnotation,
    onError: OnError<EventAnnotation>,
    dummyHandlers: DummyHandlers<EventAnnotation>,
): th.IObjectHandler<EventAnnotation> {
    onError(message, annotation, ["error", {}])
    return dummyHandlers.object()
}

function createUnexpectedTaggedUnionHandler<EventAnnotation>(
    message: inf.UnmarshallError,
    annotation: EventAnnotation,
    onError: OnError<EventAnnotation>,
    dummyHandlers: DummyHandlers<EventAnnotation>,
): th.ITaggedUnionHandler<EventAnnotation> {
    onError(message, annotation, ["error", {}])
    return dummyHandlers.taggedUnion()
}

function createUnexpectedStringHandler<EventAnnotation>(
    message: inf.UnmarshallError,
    annotation: EventAnnotation,
    onError: OnError<EventAnnotation>,
    dummyHandlers: DummyHandlers<EventAnnotation>,
): void {
    onError(message, annotation, ["error", {}])
}


export function defaultInitializeValue<EventAnnotation>(
    definition: ValueDefinition,
    handler: typed.ITypedValueHandler<EventAnnotation>,
    onError: OnError<EventAnnotation>,
): void {
    switch (definition.type[0]) {
        case "dictionary": {
            handler.onDictionary({
                token: null,
                definition: definition.type[1],
            }).onClose({
                token: null,
            })
            break
        }
        case "list": {
            handler.onList({
                token: null,
                definition: definition.type[1],
            }).onClose({
                token: null,
            })
            break
        }
        case "type reference": {
            const $e = definition.type[1]
            defaultInitializeValue(
                $e.type.get().value,
                handler.onTypeReference({
                    definition: $e,
                }),
                onError,
            )
            break
        }
        case "tagged union": {
            const $e = definition.type[1]
            const defOpt = $e["default option"].get()
            defaultInitializeValue(
                defOpt.value,
                handler.onTaggedUnion({
                    definition: $e,
                    token: null,
                }).onOption({
                    name: $e["default option"].name,
                    token: null,
                    definition: defOpt,
                }),
                onError,
            )
            break
        }
        case "simple string": {
            const $e = definition.type[1]
            handler.onSimpleString({
                value: $e["default value"],
                token: null,
                definition: $e,
            })
            break
        }
        case "multiline string": {
            const $e = definition.type[1]
            handler.onMultilineString({
                token: null,
                definition: $e,
            })
            break
        }
        case "group": {
            const $e = definition.type[1]

            const groupHandler = handler.onGroup({
                type: ["omitted", {}],
                definition: $e,
            })
            $e.properties.forEach((propDef, key) => {
                defaultInitializeValue(
                    propDef.value,
                    groupHandler.onProperty({
                        key: key,
                        token: null,
                        definition: propDef.value,
                    }),
                    onError,
                )
            })
            break
        }
        default:
            pr.au(definition.type[0])
    }
}

type MixidIn<EventAnnotation> = {
    pushGroup: (
        definition: GroupDefinition,
        groupContainerHandler: typed.ITypedValueHandler<EventAnnotation>
    ) => th.IValueHandler<EventAnnotation>
    pushTaggedUnion: (
        definition: OptionDefinition,
        taggedUnionHandler: typed.ITypedTaggedUnionHandler<EventAnnotation>,
        optionHandler: typed.ITypedValueHandler<EventAnnotation>,
    ) => void
}

export type DummyHandlers<EventAnnotation> = {
    array: () => th.IArrayHandler<EventAnnotation>
    object: () => th.IObjectHandler<EventAnnotation>
    taggedUnion: () => th.ITaggedUnionHandler<EventAnnotation>
    requiredValue: () => th.IRequiredValueHandler<EventAnnotation>
}

export function createValueUnmarshaller<EventAnnotation>(
    definition: ValueDefinition,
    handler: typed.ITypedValueHandler<EventAnnotation>,
    onError: OnError<EventAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    mixedIn: null | MixidIn<EventAnnotation>,
    dummyHandlers: DummyHandlers<EventAnnotation>,
): th.IValueHandler<EventAnnotation> {
    function defInitializeValue() {
        defaultInitializeValue(
            definition,
            handler,
            onError,
        )
    }
    switch (definition.type[0]) {
        case "dictionary": {
            const $d = definition.type[1]
            return {
                array: ($e) => {
                    defInitializeValue()
                    return createUnexpectedArrayHandler(
                        ["expected a dictionary", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                object: ($e) => {
                    const foundKeys: string[] = []
                    if ($e.token.token.type[0] !== "dictionary") {
                        onError(["object is not a dictionary", {}], $e.token.annotation, ["warning", {}])
                    }

                    const dictHandler = handler.onDictionary({
                        token: {
                            token: $e.token.token,
                            annotation: $e.token.annotation,
                        },
                        definition: $d,
                    })
                    return {
                        property: ($p) => {
                            if ($p.token.token.wrapping[0] !== "quote") {
                                onError(["entry key does not have quotes", {}], $p.token.annotation, ["warning", {}])
                            }
                            foundKeys.forEach(($) => {
                                if ($ = $p.token.token.value) {
                                    onError(["double key", {}], $p.token.annotation, ["error", {}])
                                }
                            })
                            foundKeys.push($p.token.token.value)
                            flagNonDefaultPropertiesFound()

                            const entryHandler = dictHandler.onEntry({
                                token: {
                                    token: $p.token.token,
                                    annotation: $p.token.annotation,
                                },
                            })
                            return wrap(
                                createValueUnmarshaller(
                                    $d.value,
                                    entryHandler,
                                    onError,
                                    () => { },
                                    null,
                                    dummyHandlers,
                                ),
                                () => {
                                    defaultInitializeValue(
                                        $d.value,
                                        entryHandler,
                                        onError,
                                    )
                                }
                            )
                        },
                        onEnd: ($ee) => {
                            dictHandler.onClose({
                                token: {
                                    token: {},
                                    annotation: $ee.token.annotation,
                                },
                            })

                        },
                    }
                },
                taggedUnion: ($e) => {
                    defInitializeValue()
                    return createUnexpectedTaggedUnionHandler(
                        ["expected a dictionary", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                simpleString: ($e) => {
                    defInitializeValue()
                    return createUnexpectedStringHandler(
                        ["expected a dictionary", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                multilineString: ($e) => {
                    defInitializeValue()
                    return createUnexpectedStringHandler(
                        ["expected a dictionary", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
            }

        }
        case "list": {
            const $d = definition.type[1]
            return {
                array: ($e) => {
                    if ($e.token.token.type[0] !== "list") {
                        onError(["array is not a list", {}], $e.token.annotation, ["error", {}])
                    }
                    const listHandler = handler.onList({
                        token: {
                            token: $e.token.token,
                            annotation: $e.token.annotation,
                        },
                        definition: $d,
                    })
                    return {
                        element: ($) => {
                            flagNonDefaultPropertiesFound()
                            // const entry = collBuilder.createEntry(_errorMessage => {
                            //     //onError(errorMessage, svData)
                            // })
                            const elementSideEffects = listHandler.onElement({})
                            return createValueUnmarshaller(
                                $d.value,
                                elementSideEffects,
                                onError,
                                () => { },
                                null,
                                dummyHandlers,
                            )
                        },
                        onEnd: ($) => {
                            listHandler.onClose({
                                token: {
                                    token: {},
                                    annotation: $.token.annotation,
                                },
                            })
                        },
                    }
                },
                object: ($e) => {
                    defInitializeValue()
                    return createUnexpectedObjectHandler(
                        ["expected a list", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                taggedUnion: ($e) => {
                    defInitializeValue()
                    return createUnexpectedTaggedUnionHandler(
                        ["expected a list", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                simpleString: ($e) => {
                    defInitializeValue()
                    return createUnexpectedStringHandler(
                        ["expected a list", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                multilineString: ($e) => {
                    defInitializeValue()
                    return createUnexpectedStringHandler(
                        ["expected a list", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
            }
        }
        case "type reference": {
            const $e = definition.type[1]
            return createValueUnmarshaller(
                $e.type.get().value,
                handler.onTypeReference({
                    definition: $e,
                }),
                onError,
                flagNonDefaultPropertiesFound,
                mixedIn,
                dummyHandlers,
            )
        }
        case "tagged union": {
            const $d = definition.type[1]
            function doOption<T>(
                optionToken: th.SimpleStringToken<EventAnnotation>,
                definition: TaggedUnionDefinition,
                tuHandler: typed.ITypedTaggedUnionHandler<EventAnnotation>,
                unknownCallback: () => T,
                knownCallback: (option: OptionDefinition, handler: typed.ITypedValueHandler<EventAnnotation>) => T,
            ): T {
                return definition.options.find(
                    optionToken.token.value,
                    (optionDefinition) => {
                        if (optionDefinition !== definition["default option"].get()) {
                            flagNonDefaultPropertiesFound()
                        }
                        return knownCallback(
                            optionDefinition,
                            tuHandler.onOption({
                                definition: optionDefinition,
                                name: optionToken.token.value,
                                token: optionToken,
                            })
                        )
                    },
                    (keys) => {
                        onError(
                            ["unknown option", {
                                "known options": keys,
                            }],
                            optionToken.annotation,
                            ["error", {}]
                        )
                        defaultInitializeValue(
                            definition["default option"].get().value,
                            tuHandler.onUnexpectedOption({
                                defaultOption: definition["default option"].name,
                                expectedOptions: keys,
                                token: optionToken,
                                //stateGroupDefinition: $e,
                            }),
                            onError,
                        )
                        return unknownCallback()
                    },
                )
            }
            return {
                array: ($e) => {
                    defInitializeValue()
                    return createUnexpectedArrayHandler(
                        ["expected a tagged union", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                object: ($e) => {
                    defInitializeValue()
                    return createUnexpectedObjectHandler(
                        ["expected a tagged union", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                taggedUnion: ($tu) => {
                    const tuHandler = handler.onTaggedUnion({
                        definition: $d,
                        token: $tu.token,
                    })
                    return {
                        option: ($e) => {
                            return doOption(
                                $e.token,
                                $d,
                                tuHandler,
                                () => dummyHandlers.requiredValue(),
                                (option, subHandler) => {
                                    return wrap(
                                        createValueUnmarshaller(
                                            option.value,
                                            subHandler,
                                            onError,
                                            flagNonDefaultPropertiesFound,
                                            mixedIn,
                                            dummyHandlers,
                                        ),
                                        () => {
                                            defaultInitializeValue(
                                                option.value,
                                                subHandler,
                                                onError,
                                            )
                                        }
                                    )
                                }
                            )
                        },
                        missingOption: () => {
                            onError(["missing option", {}], $tu.token.annotation, ["error", {}])
                            defaultInitializeValue(
                                $d["default option"].get().value,
                                tuHandler.onOption({
                                    name: $d["default option"].name,
                                    token: null,
                                    definition: $d["default option"].get(),
                                }),
                                onError,
                            )
                        },
                        end: ($) => {
                            tuHandler.onEnd({})
                        },
                    }
                },
                simpleString: ($e) => {
                    if (mixedIn !== null) {
                        if ($e.token.token.wrapping[0] === "apostrophe") {
                            const tuHandler = handler.onTaggedUnion({
                                definition: $d,
                                token: null,
                            })
                            return doOption(
                                $e.token,
                                $d,
                                tuHandler,
                                () => { },
                                (option, subHandler) => {
                                    mixedIn.pushTaggedUnion(
                                        option,
                                        tuHandler,
                                        subHandler
                                    )
                                }
                            )
                        } else {
                            defInitializeValue()
                            return createUnexpectedStringHandler(
                                ["expected a tagged union", {}],
                                $e.token.annotation,
                                onError,
                                dummyHandlers,
                            )
                        }
                    } else {
                        defInitializeValue()
                        return createUnexpectedStringHandler(
                            ["expected a tagged union", {}],
                            $e.token.annotation,
                            onError,
                            dummyHandlers,
                        )
                    }
                },
                multilineString: ($e) => {
                    defInitializeValue()
                    return createUnexpectedStringHandler(
                        ["expected a tagged union", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
            }
        }
        case "simple string": {
            const $d = definition.type[1]
            const error: inf.UnmarshallError = $d.quoted
                ? ["expected an unquoted string", {}]
                : ["expected a quoted string", {}]
            return {
                array: ($e) => {
                    defInitializeValue()
                    return createUnexpectedArrayHandler(
                        error,
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                object: ($e) => {
                    defInitializeValue()
                    return createUnexpectedObjectHandler(
                        error,
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                taggedUnion: ($e) => {
                    defInitializeValue()
                    return createUnexpectedTaggedUnionHandler(
                        error,
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                multilineString: ($e) => {
                    defInitializeValue()
                    return createUnexpectedStringHandler(
                        error,
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                simpleString: ($e) => {
                    const value = $e.token.token.value
                    if (value !== $d["default value"]) {
                        flagNonDefaultPropertiesFound()
                    }
                    handler.onSimpleString({
                        value: $e.token.token.value,
                        token: {
                            token: $e.token.token,
                            annotation: $e.token.annotation,
                        },
                        definition: $d,
                        //  valueBuilder:   valueBuilder,
                        //     $e
                    })
                    switch ($e.token.token.wrapping[0]) {
                        case "none": {
                            if ($d.quoted) {
                                onError(["value should have quotes", {}], $e.token.annotation, ["warning", {}])
                            }
                            break
                        }
                        case "quote": {
                            if (!$d.quoted) {
                                onError(["value should not have quotes", {}], $e.token.annotation, ["warning", {}])
                            }
                            break
                        }
                        case "apostrophe": {
                            onError($d.quoted ? ["value should have quotes instead of apostrophes", {}] : ["value should not have apostrophes", {}], $e.token.annotation, ["warning", {}])
                            break
                        }
                        default:
                            pr.au($e.token.token.wrapping[0])
                    }
                },
            }
        }
        case "multiline string": {
            const $d = definition.type[1]

            return {
                array: ($e) => {
                    defInitializeValue()
                    return createUnexpectedArrayHandler(
                        ["expected a multiline string", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                object: ($e) => {
                    defInitializeValue()
                    return createUnexpectedObjectHandler(
                        ["expected a multiline string", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                taggedUnion: ($e) => {
                    defInitializeValue()
                    return createUnexpectedTaggedUnionHandler(
                        ["expected a multiline string", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
                multilineString: ($e) => {
                    if ($e.token.token.lines.length > 1) {
                        flagNonDefaultPropertiesFound()
                    } else {
                        if ($e.token.token.lines.length === 1 && pr.getElement($e.token.token.lines, 0) !== "") {
                            flagNonDefaultPropertiesFound()
                        }
                    }
                    handler.onMultilineString({
                        token: {
                            token: $e.token.token,
                            annotation: $e.token.annotation,
                        },
                        definition: $d,
                    })
                },
                simpleString: ($e) => {
                    defInitializeValue()
                    return createUnexpectedStringHandler(
                        ["expected a multiline string", {}],
                        $e.token.annotation,
                        onError,
                        dummyHandlers,
                    )
                },
            }
        }
        case "group": {
            const $d = definition.type[1]
            return {
                array: ($e) => {
                    if ($e.token.token.type[0] !== "shorthand group") {
                        if (mixedIn === null) {
                            onError(["expected a group", {}], $e.token.annotation, ["error", {}])
                            defInitializeValue()
                            return dummyHandlers.array()
                        } else {
                            return mixedIn.pushGroup($d, handler).array($e)
                        }
                    } else {
                        //start a shorthand group

                        const state = createShorthandParsingState(
                            $d,
                            handler.onGroup({
                                type: ["shorthand", {
                                    token: $e.token.token,
                                    annotation: $e.token.annotation,
                                }],
                                definition: $d,
                            }),
                        )

                        function createUnmarshallerForNextValue(): th.IValueHandler<EventAnnotation> {
                            const nextValue = state.findNextValue()
                            if (nextValue === null) {
                                return {
                                    array: ($) => {
                                        onError(["superfluous element", {}], $.token.annotation, ["error", {}])
                                        return dummyHandlers.array()
                                    },
                                    object: ($) => {
                                        onError(["superfluous element", {}], $.token.annotation, ["error", {}])
                                        return dummyHandlers.object()
                                    },
                                    taggedUnion: ($) => {
                                        onError(["superfluous element", {}], $.token.annotation, ["error", {}])
                                        return dummyHandlers.taggedUnion()
                                    },
                                    simpleString: ($) => {
                                        onError(["superfluous element", {}], $.token.annotation, ["error", {}])
                                    },
                                    multilineString: ($) => {
                                        onError(["superfluous element", {}], $.token.annotation, ["error", {}])
                                    },
                                }
                            } else {

                                return createValueUnmarshaller(
                                    nextValue.definition,
                                    nextValue.handler,
                                    onError,
                                    flagNonDefaultPropertiesFound,
                                    {
                                        pushGroup: (definition, handler) => {
                                            state.pushGroup(definition, handler)
                                            return createUnmarshallerForNextValue()
                                        },
                                        pushTaggedUnion: (definition, taggedUnionHandler, optionHandler) => {
                                            state.pushTaggedUnion(definition, taggedUnionHandler, optionHandler)
                                        },
                                    },
                                    dummyHandlers,
                                )
                            }
                        }
                        return {
                            element: () => {
                                return createUnmarshallerForNextValue()
                            },
                            onEnd: ($e) => {
                                state.wrapup(
                                    $e.token.annotation,
                                    onError,
                                )
                            },
                        }
                    }
                },
                object: ($e) => {
                    if ($e.token.token.type[0] !== "verbose group") {
                        if (mixedIn === null) {
                            onError(["expected a group", {}], $e.token.annotation, ["error", {}])
                            defInitializeValue()
                            return dummyHandlers.object()
                        } else {
                            return mixedIn.pushGroup($d, handler).object($e)
                        }
                    } else {
                        //start a verbose group
                        const groupHandler = handler.onGroup({
                            type: ["verbose", {
                                annotation: $e.token.annotation,
                                token: $e.token.token,
                            }],
                            definition: $d,
                        })

                        const processedProperties: {
                            [key: string]: {
                                annotation: EventAnnotation
                                isNonDefault: boolean
                            }
                        } = {}
                        return {
                            property: ($p) => {
                                const key = $p.token.token.value
                                if ($p.token.token.wrapping[0] !== "apostrophe") {
                                    onError(["property key does not have apostrophes", {}], $p.token.annotation, ["warning", {}])
                                }
                                return $d.properties.find(
                                    key,
                                    (propertyDefinition) => {
                                        const pp = {
                                            annotation: $p.token.annotation,
                                            isNonDefault: false,
                                        }
                                        processedProperties[key] = pp

                                        const propertyHandler = groupHandler.onProperty({
                                            key: $p.token.token.value,
                                            token: $p.token,
                                            definition: propertyDefinition.value,
                                        })
                                        return wrap(
                                            createValueUnmarshaller(
                                                propertyDefinition.value,
                                                propertyHandler,
                                                onError,
                                                () => {
                                                    pp.isNonDefault = true
                                                },
                                                null,
                                                dummyHandlers,
                                            ),
                                            () => {
                                                defaultInitializeValue(
                                                    propertyDefinition.value,
                                                    propertyHandler,
                                                    onError,
                                                )
                                            }
                                        )
                                    },
                                    (keys) => {
                                        onError(["unknown property", { "known properties": keys }], $p.token.annotation, ["error", {}])
                                        groupHandler.onUnexpectedProperty({
                                            token: $p.token,
                                            groupDefinition: $d,
                                            expectedProperties: keys,
                                        })
                                        return dummyHandlers.requiredValue()
                                    }
                                )
                            },
                            onEnd: ($$) => {
                                let hadNonDefaultProperties = false

                                $d.properties.forEach((propDefinition, propKey) => {
                                    const pp = processedProperties[propKey]
                                    if (pp === undefined) {
                                        defaultInitializeValue(
                                            propDefinition.value,
                                            groupHandler.onProperty({
                                                key: propKey,
                                                token: null,
                                                definition: propDefinition.value,
                                            }),
                                            onError,
                                        )
                                    } else {
                                        if (!pp.isNonDefault) {
                                            onError(["property has default value, remove", {}], pp.annotation, ["warning", {}])
                                        } else {
                                            hadNonDefaultProperties = true
                                        }
                                    }
                                })
                                if (hadNonDefaultProperties) {
                                    flagNonDefaultPropertiesFound()
                                }
                                groupHandler.onClose({
                                    token: {
                                        token: {},
                                        annotation: $$.token.annotation,
                                    },
                                })
                            },
                        }
                    }
                },
                taggedUnion: ($e) => {
                    if (mixedIn === null) {
                        onError(["expected a group", {}], $e.token.annotation, ["error", {}])
                        defInitializeValue()
                        return dummyHandlers.taggedUnion()
                    } else {
                        return mixedIn.pushGroup($d, handler).taggedUnion($e)
                    }
                },
                simpleString: ($e) => {
                    if (mixedIn === null) {
                        onError(["expected a group", {}], $e.token.annotation, ["error", {}])
                        defInitializeValue()
                    } else {
                        return mixedIn.pushGroup($d, handler).simpleString($e)
                    }
                },
                multilineString: ($e) => {
                    if (mixedIn === null) {
                        onError(["expected a group", {}], $e.token.annotation, ["error", {}])
                        defInitializeValue()
                    } else {
                        mixedIn.pushGroup($d, handler).multilineString($e)
                    }
                },

            }
        }
        default:
            return pr.au(definition.type[0])
    }
}
