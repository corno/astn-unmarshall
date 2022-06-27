import { IStreamConsumer } from "astn-unmarshall-api";
import { ISchemaAndSideEffects } from "astn-typedtreehandler-api";
export declare type CreateExternalSchemaLoader<EventAnnotation> = ($: {
    onFailed: () => void;
    onSucces: ($: ISchemaAndSideEffects<EventAnnotation>) => void;
}) => IStreamConsumer<string, null>;
