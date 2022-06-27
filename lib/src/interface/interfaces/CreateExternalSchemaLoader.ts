import { IStreamConsumer } from "astn-unmarshall-api";
import { ISchemaAndSideEffects } from "astn-typedtreehandler-api";

export type CreateExternalSchemaLoader<EventAnnotation> = ($: {
    onFailed: () => void
    onSucces: ($: ISchemaAndSideEffects<EventAnnotation>) => void
}) => IStreamConsumer<string, null>