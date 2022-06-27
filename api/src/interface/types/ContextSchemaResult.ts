import { ISchemaAndSideEffects } from "astn-typedtreehandler-api"
export type ContextSchemaResult<EventAnnotation> =
    | ["ignored", {}]
    | ["not available", {}]
    | ["has errors", {}]
    | ["available", ISchemaAndSideEffects<EventAnnotation>]
