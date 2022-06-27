import { ISchemaAndSideEffects } from "astn-typedtreehandler-api";
export declare type ContextSchemaResult<EventAnnotation> = ["ignored", {}] | ["not available", {}] | ["has errors", {}] | ["available", ISchemaAndSideEffects<EventAnnotation>];
