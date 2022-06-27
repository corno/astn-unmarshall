export declare type IStreamConsumer<DataType, EndDataType> = {
    onData(data: DataType): void;
    onEnd(data: EndDataType): void;
};
