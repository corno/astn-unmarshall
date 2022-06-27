import * as grammar from "astn-handlers-api";

import * as typedTokenize from "astn-typedtreehandler-api";
import { DiagnosticSeverity } from "astn-unmarshall-api";
import { InternalSchemaSpecification } from "../types/InternalSchemaSpecification";
import { UnmarshallError } from "astn-unmarshall-api";

export type CreateTreeUnmarshaller2<EventAnnotation> = ($: {
    specification: InternalSchemaSpecification
    schemaAndSideEffects: typedTokenize.ISchemaAndSideEffects<EventAnnotation>
    onError: (
        message: UnmarshallError,
        annotation: EventAnnotation,
        severity: DiagnosticSeverity
    ) => void
}) => grammar.ITreeHandler<EventAnnotation>