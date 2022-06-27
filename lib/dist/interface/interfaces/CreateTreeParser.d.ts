import { IContentParser } from "astn-parser-api";
import { ITreeHandler } from "astn-handlers-api";
export declare type CreateTreeParser<EventAnnotation> = (handler: ITreeHandler<EventAnnotation> | null) => IContentParser<EventAnnotation>;
