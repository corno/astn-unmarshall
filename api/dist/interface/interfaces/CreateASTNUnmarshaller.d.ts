import { ASTNUnmarshallIssue } from "../types/ASTNUnmarshallIssue";
import { ContextSchemaResult } from "../types/ContextSchemaResult";
import { SchemaSchemaBuilder } from "astn-typedtreehandler-api";
import { IResourceProvider } from "./IResourceProvider";
import * as h from "astn-handlers-api";
export declare type CreateASTNUnmarshaller<EventAnnotation> = ($p: {
    handler: {
        contextSchema: ContextSchemaResult<EventAnnotation>;
        referencedSchemaProvider: IResourceProvider;
        onUnmarshallError: ($: ASTNUnmarshallIssue<EventAnnotation>) => void;
        getInternalSchemaSchemaBuilder: (name: string) => SchemaSchemaBuilder<EventAnnotation, EventAnnotation> | null;
    };
}) => h.IStructureHandler<EventAnnotation>;
