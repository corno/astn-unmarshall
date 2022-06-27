import { SchemaSchemaBuilder } from "astn-typedtreehandler-api"
import { IContentTokenConsumer } from "astn-tokenconsumer-api"
import { ISchemaAndSideEffects } from "astn-typedtreehandler-api"
import { IStructureHandler } from "astn-handlers-api"
import { CreateTreeParser } from "../../../astn/interface/interfaces/CreateTreeParser"
import { ITreeHandler } from "astn-handlers-api"

export function createSchemaHandler<SchemaAnnotation, BodyAnnotation>(
    getSchemaSchemaBuilder: (
        name: string,
    ) => SchemaSchemaBuilder<SchemaAnnotation, BodyAnnotation> | null,
    onError: () => void,
    onSchema: (schema: ISchemaAndSideEffects<BodyAnnotation> | null) => void,
    createTreeParser: CreateTreeParser<SchemaAnnotation>,
    createDummyTreeHandler: () => ITreeHandler<SchemaAnnotation>,
): IStructureHandler<SchemaAnnotation> {
    let foundError = false

    let schemaDefinitionFound = false
    let schemaSchemaBuilder: null | SchemaSchemaBuilder<SchemaAnnotation, BodyAnnotation> = null
    function onSchemaError() {
        onError()
        foundError = true
    }

    function createDummyParser(
    ): IContentTokenConsumer<SchemaAnnotation> {
        return createTreeParser(null)//creates parsing errors
    }

    return {
        onNoInternalSchema: () => { },
        onEmbeddedSchema: ($$) => {
            onSchemaError()
            return createDummyTreeHandler()
        },
        onSchemaReference: ($$) => {
            schemaDefinitionFound = true
            schemaSchemaBuilder = getSchemaSchemaBuilder($$.token.token.value)
            if (schemaSchemaBuilder === null) {
                //console.error(`unknown schema schema '${schemaSchemaReference.data.value}'`)
                onSchemaError()
            }
        },
        onBody: () => {
            if (!schemaDefinitionFound) {
                //console.error("missing schema schema types")
                onSchemaError()
                return createDummyParser()
            } else {
                if (schemaSchemaBuilder === null) {
                    if (!foundError) {
                        throw new Error("UNEXPECTED: SCHEMA PROCESSOR NOT SUBSCRIBED AND NO ERRORS")
                    }
                    return createDummyParser()
                } else {
                    const x = createTreeParser(
                        schemaSchemaBuilder(
                            (error, annotation2) => {
                                onError()
                            },
                            (schemaAndSideEffects) => {
                                onSchema(schemaAndSideEffects)
                            }
                        )
                    )
                    return x
                }
            }
        },
    }
}
