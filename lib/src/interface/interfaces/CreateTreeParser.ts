import { IContentParser } from "astn-parser-api";
import { ITreeHandler } from "astn-handlers-api";

// export type CreateTreeHandlerAndHandleErrorsParams<EventAnnotation> = {
//     handler: ITreeHandler<EventAnnotation> | null
//     onError: ($: {
//         error: ParsingError
//         annotation: EventAnnotation
//     }) => void
// }

// export type CreateTreeParserAndHandleErrors<EventAnnotation> = (
//     $p: CreateTreeHandlerAndHandleErrorsParams<EventAnnotation>
// ) => IContentParser<EventAnnotation>

export type CreateTreeParser<EventAnnotation> = (
    handler: ITreeHandler<EventAnnotation> | null,
) => IContentParser<EventAnnotation>