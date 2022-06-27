import { Schema } from "astn-typedtreehandler-api"
import { ITypedTreeHandler } from "astn-typedtreehandler-api"
import { ITreeHandler } from "astn-handlers-api"
import { DiagnosticSeverity } from "astn-unmarshall-api"
import { UnmarshallError } from "astn-unmarshall-api"
import { createValueUnmarshaller, defaultInitializeValue, DummyHandlers } from "./createValueUnmarshaller"

export function createTreeUnmarshaller<EventAnnotation>($: {
    schema: Schema
    handler: ITypedTreeHandler<EventAnnotation>
    onError: (message: UnmarshallError, annotation: EventAnnotation, severity: DiagnosticSeverity) => void
    dummyHandlers: DummyHandlers<EventAnnotation>
}): ITreeHandler<EventAnnotation> {

    return {
        root: {
            exists: createValueUnmarshaller(
                $.schema["root type"].get().value,
                $.handler.root,
                $.onError,
                () => { },
                null,
                $.dummyHandlers,
            ),
            missing: () => {
                defaultInitializeValue(
                    $.schema["root type"].get().value,
                    $.handler.root,
                    $.onError,
                )
            },
        },
        onEnd: () => $.handler.onEnd({}),
    }
}
