import { IContentTokenConsumer } from "astn-tokenconsumer-api";
import { ITreeHandler } from "astn-handlers-api";
export declare type CreateTreeParser<EventAnnotation> = (handler: ITreeHandler<EventAnnotation> | null) => IContentTokenConsumer<EventAnnotation>;
