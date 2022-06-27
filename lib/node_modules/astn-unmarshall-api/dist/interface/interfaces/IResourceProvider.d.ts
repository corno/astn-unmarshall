import { IStreamConsumer } from "./IStreamConsumer";
import { RetrievalError } from "../types/RetrievalError";
export declare type IResourceProvider = {
    getResource(id: string, streamConsumer: IStreamConsumer<string, null>, onFailed: ($: RetrievalError) => void): void;
};
