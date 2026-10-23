/**
 * Stored as text. `true` and `false` are illegal GraphQL enum names, so this cannot be a select
 * field or the schema fails to build for every consumer. The admin still shows a select.
 */
export declare const trueFalseAnswerOptions: readonly [{
    readonly label: "True";
    readonly value: "true";
}, {
    readonly label: "False";
    readonly value: "false";
}, {
    readonly label: "Both";
    readonly value: "both";
}];
export type TrueFalseAnswer = (typeof trueFalseAnswerOptions)[number]['value'];
export declare const isTrueFalseAnswer: (value: unknown) => value is TrueFalseAnswer;
