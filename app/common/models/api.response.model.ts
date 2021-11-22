export type ApiResponseWrapper<T> = T | ApiFailure

export class ApiFailure {
    source: string
    message: string

    constructor(source: string, message: string) {
        this.source = source
        this.message = message
    }
}
