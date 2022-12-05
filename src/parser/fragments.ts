export enum TokenType {
    NUMBER = 'NUMBER',
    WORD = 'WORD',
    FUNCTION_START = 'FUNCTION_START',
    NEW_LINE = 'NEW_LINE',
    IF = 'IF',
    THEN = 'THEN',
    ELSE = 'ELSE',
    BEGIN = 'BEGIN',
    UNTIL = 'UNTIL',
    STRING = 'STRING',
    SEMICOLON = 'SEMICOLON'
}

export interface Token {
    type: TokenType;
}

export interface NumberToken extends Token {
    type: TokenType.NUMBER;
    value: number;
}

export interface WordToken extends Token {
    type: TokenType.WORD;
    value: string;
}

export interface StringToken extends Token {
    type: TokenType.STRING;
    value: string;
}

export interface SymbolToken extends Token {
    type: TokenType.FUNCTION_START | TokenType.NEW_LINE | TokenType.IF | TokenType.THEN | TokenType.ELSE | TokenType.BEGIN | TokenType.UNTIL | TokenType.SEMICOLON;
}

export interface Program {
    functions: Map<string, Function>;
}

export interface Function {
    name: string;
    fragments: Fragment[];
}

export enum FragmentType {
    ATOM = 'ATOM',
    IF_CONDITION = 'IF_CONDITION',
    BEGIN_UNTIL_LOOP = 'BEGIN_UNTIL_LOOP',
}
export interface Fragment {
    type: FragmentType;
    value: Token | IfCondition | BeginUntilLoop;
}

export interface IfCondition {
    then: Fragment[];
    otherwise?: Fragment[];
}

export interface BeginUntilLoop {
    body: Fragment[];
}
