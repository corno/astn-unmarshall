export type RetrievalError =
    | ["not found", {}]
    | [
        "other",
        {
            readonly "description": string;
        }
    ];
