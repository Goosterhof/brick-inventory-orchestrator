export class MissingRefValueError extends Error {
    constructor() {
        super('Expected ref to have a value but it was undefined or null.');
        this.name = 'MissingRefValueError';
    }
}
