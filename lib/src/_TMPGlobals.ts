interface Array<T> {
    join(separator: string): string
    length: number
    slice(position: number): T[]
    pop: () => T
    push(v: T): void
    [n: number]: T

}

interface ErrorConstructor {
    new(message?: string): Error
}

declare let Error: ErrorConstructor;
