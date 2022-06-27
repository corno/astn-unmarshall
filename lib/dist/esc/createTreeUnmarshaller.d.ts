import { Schema } from "astn-typedtreehandler-api";
import { ITypedTreeHandler } from "astn-typedtreehandler-api";
import { ITreeHandler } from "astn-handlers-api";
import { DiagnosticSeverity } from "astn-unmarshall-api";
import { UnmarshallError } from "astn-unmarshall-api";
import { DummyHandlers } from "./createValueUnmarshaller";
export declare function createTreeUnmarshaller<EventAnnotation>($: {
    schema: Schema;
    handler: ITypedTreeHandler<EventAnnotation>;
    onError: (message: UnmarshallError, annotation: EventAnnotation, severity: DiagnosticSeverity) => void;
    dummyHandlers: DummyHandlers<EventAnnotation>;
}): ITreeHandler<EventAnnotation>;
