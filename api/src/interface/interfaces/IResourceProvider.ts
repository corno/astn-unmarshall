import { IStreamConsumer } from "./IStreamConsumer";
import { RetrievalError } from "../types/RetrievalError";
export type IResourceProvider = {
    getResource(id: string, streamConsumer: IStreamConsumer<string, null>, onFailed: ($: RetrievalError) => void): void;
};
