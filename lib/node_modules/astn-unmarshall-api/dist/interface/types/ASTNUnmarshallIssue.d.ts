import { DiagnosticSeverity } from "./DiagnosticSeverity";
import { SchemaDeserializationError } from "astn-typedtreehandler-api";
import { UnmarshallError } from "./UnmarshallError";
export declare type ASTNUnmarshallIssueType = ["no schema", {}] | ["found both internal and context schema. ignoring internal schema", {}] | ["invalid embedded schema", {}] | ["invalid schema reference", {}] | ["unmarshall", UnmarshallError] | ["embedded schema error", SchemaDeserializationError] | ["schema not found", {}] | [
    "loading error",
    {
        message: string;
    }
];
export declare type ASTNUnmarshallIssue<EventAnnotation> = {
    type: ASTNUnmarshallIssueType;
    annotation: EventAnnotation | null;
    severity: DiagnosticSeverity;
};
