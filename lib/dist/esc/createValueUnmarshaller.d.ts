import { GroupDefinition, OptionDefinition, ValueDefinition } from "astn-typedtreehandler-api";
import * as inf from "astn-unmarshall-api";
import * as typed from "astn-typedtreehandler-api";
import * as th from "astn-handlers-api";
export declare type ValueContext<EventAnnotation> = {
    definition: typed.ValueDefinition;
    handler: typed.ITypedValueHandler<EventAnnotation>;
};
export declare type IShorthandParsingState<EventAnnotation> = {
    wrapup(annotation: EventAnnotation, onError: (message: inf.UnmarshallError, annotation: EventAnnotation, severity: inf.DiagnosticSeverity) => void): void;
    findNextValue(): ValueContext<EventAnnotation> | null;
    pushGroup(definition: typed.GroupDefinition, handler: typed.ITypedValueHandler<EventAnnotation>): void;
    pushTaggedUnion(definition: typed.OptionDefinition, taggedUnionHandler: typed.ITypedTaggedUnionHandler<EventAnnotation>, optionHandler: typed.ITypedValueHandler<EventAnnotation>): void;
};
declare type OnError<EventAnnotation> = (message: inf.UnmarshallError, annotation: EventAnnotation, severity: inf.DiagnosticSeverity) => void;
export declare function defaultInitializeValue<EventAnnotation>(definition: ValueDefinition, handler: typed.ITypedValueHandler<EventAnnotation>, onError: OnError<EventAnnotation>): void;
declare type MixidIn<EventAnnotation> = {
    pushGroup: (definition: GroupDefinition, groupContainerHandler: typed.ITypedValueHandler<EventAnnotation>) => th.IValueHandler<EventAnnotation>;
    pushTaggedUnion: (definition: OptionDefinition, taggedUnionHandler: typed.ITypedTaggedUnionHandler<EventAnnotation>, optionHandler: typed.ITypedValueHandler<EventAnnotation>) => void;
};
export declare type DummyHandlers<EventAnnotation> = {
    array: () => th.IArrayHandler<EventAnnotation>;
    object: () => th.IObjectHandler<EventAnnotation>;
    taggedUnion: () => th.ITaggedUnionHandler<EventAnnotation>;
    requiredValue: () => th.IRequiredValueHandler<EventAnnotation>;
};
export declare function createValueUnmarshaller<EventAnnotation>(definition: ValueDefinition, handler: typed.ITypedValueHandler<EventAnnotation>, onError: OnError<EventAnnotation>, flagNonDefaultPropertiesFound: () => void, mixedIn: null | MixidIn<EventAnnotation>, dummyHandlers: DummyHandlers<EventAnnotation>): th.IValueHandler<EventAnnotation>;
export {};
