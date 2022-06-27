import * as api from "astn-unmarshall-api"
import * as typed from "astn-typedtreehandler-api"

import { IStructureHandler } from "astn-handlers-api"
import * as th from "astn-handlers-api"

import { createASTNUnmarshaller } from "./esc/createASTNUnmarshaller"
import { createTreeUnmarshaller } from "./esc/createTreeUnmarshaller"
import { createUnmarshallErrorMessage } from "./esc/createUnmarshallErrorMessage"
import { CreateExternalSchemaLoader, CreateTreeParser, CreateTreeUnmarshaller2 } from "./interface"

export type DummyHandlers<EventAnnotation> = {
    array: () => th.IArrayHandler<EventAnnotation>
    object: () => th.IObjectHandler<EventAnnotation>
    taggedUnion: () => th.ITaggedUnionHandler<EventAnnotation>
    requiredValue: () => th.IRequiredValueHandler<EventAnnotation>
}

export type CreateASTNUnmarshaller = <EventAnnotation>(
    $p: {
        handler: {
            contextSchema: api.ContextSchemaResult<EventAnnotation>
            referencedSchemaProvider: api.IResourceProvider
            onUnmarshallError: ($: api.ASTNUnmarshallIssue<EventAnnotation>) => void
            getInternalSchemaSchemaBuilder: (
                name: string,
            ) => typed.SchemaSchemaBuilder<EventAnnotation, EventAnnotation> | null
        }
    },
    createBodyTreeParser: CreateTreeParser<EventAnnotation>,
    createTreeUnmarshaller: CreateTreeUnmarshaller2<EventAnnotation>,
    createExternalSchemaLoader: CreateExternalSchemaLoader<EventAnnotation>,
) => IStructureHandler<EventAnnotation>


export type CreateTreeUnmarshaller = <EventAnnotation>($: {
    schema: typed.Schema
    handler: typed.ITypedTreeHandler<EventAnnotation>
    onError: (message: api.UnmarshallError, annotation: EventAnnotation, severity: api.DiagnosticSeverity) => void
    dummyHandlers: DummyHandlers<EventAnnotation>
}) => th.ITreeHandler<EventAnnotation>

export type API = {
    createASTNUnmarshaller: CreateASTNUnmarshaller,
    createTreeUnmarshaller: CreateTreeUnmarshaller,
    createUnmarshallErrorMessage: (error: api.UnmarshallError) => string
}

export const $: API = {
    createASTNUnmarshaller: createASTNUnmarshaller,
    createTreeUnmarshaller: createTreeUnmarshaller,
    createUnmarshallErrorMessage: createUnmarshallErrorMessage,
}
