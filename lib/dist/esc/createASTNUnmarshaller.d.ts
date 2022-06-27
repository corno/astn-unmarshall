import * as api from "astn-unmarshall-api";
import { SchemaSchemaBuilder } from "astn-typedtreehandler-api";
import { IStructureHandler } from "astn-handlers-api";
import * as inf from "../interface";
export declare function createASTNUnmarshaller<EventAnnotation>($p: {
    handler: {
        contextSchema: api.ContextSchemaResult<EventAnnotation>;
        referencedSchemaProvider: api.IResourceProvider;
        onUnmarshallError: ($: api.ASTNUnmarshallIssue<EventAnnotation>) => void;
        getInternalSchemaSchemaBuilder: (name: string) => SchemaSchemaBuilder<EventAnnotation, EventAnnotation> | null;
    };
}, createBodyTreeParser: inf.CreateTreeParser<EventAnnotation>, createTreeUnmarshaller: inf.CreateTreeUnmarshaller2<EventAnnotation>, createExternalSchemaLoader: inf.CreateExternalSchemaLoader<EventAnnotation>): IStructureHandler<EventAnnotation>;
