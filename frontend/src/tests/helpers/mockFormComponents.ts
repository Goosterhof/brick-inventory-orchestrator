export const createMockFormField = () => ({default: {name: 'FormField', template: '<div><slot /></div>'}});

export const createMockFormLabel = () => ({
    default: {name: 'FormLabel', template: '<label><slot /></label>', props: ['for', 'optional']},
});

export const createMockFormError = () => ({
    default: {name: 'FormError', template: '<span />', props: ['error', 'id', 'message']},
});
