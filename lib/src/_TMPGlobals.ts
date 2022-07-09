interface Array<T> {
    join(separator: string): string
    length: number
    slice(position: number): T[]
    pop: () => T
    push(v: T): void
    [n: number]: T

}