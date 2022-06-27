export declare type IReadonlyLookup<T> = {
    readonly "getUnsafe": (key: string) => T;
    readonly "with": <RT>(key: string, ifExists: (v: T) => RT, ifNotExists: (keys: string[]) => RT) => RT;
};
