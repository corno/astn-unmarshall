import { SchemaError } from "../types/SchemaError";
import { IStructureHandler } from "astn-handlers-api";
import { ISchemaAndSideEffects } from "astn-typedtreehandler-api";
import { SchemaSchemaBuilder } from "astn-typedtreehandler-api";
import { CreateTreeParserAndHandleErrors } from "../../../astn/interface/interfaces/CreateTreeParser";

export type CreateSchemaHandler<SchemaAnnotation, BodyAnnotation> = (
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<SchemaAnnotation, BodyAnnotation> | null,
    onError: (error: SchemaError, annotation: SchemaAnnotation | null) => void,
    onSchema: (schema: ISchemaAndSideEffects<BodyAnnotation> | null) => void,
    createTreeParser: CreateTreeParserAndHandleErrors<SchemaAnnotation>,
) => IStructureHandler<SchemaAnnotation>