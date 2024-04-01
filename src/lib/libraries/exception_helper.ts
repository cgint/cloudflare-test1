export function exceptionToString(err: any): string {
    return `Type: ${typeof err} - Message: ${err.message} - ${JSON.stringify(err)}`;
}

