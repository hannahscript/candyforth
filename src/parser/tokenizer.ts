import {NumberToken, StringToken, SymbolToken, Token, TokenType, WordToken} from './fragments';

interface TokenizerState {
    buffer: string;
    quote: boolean;
    previous: string;
    tokens: Token[];
}

export function tokenize(source: string): Token[] {
    const state: TokenizerState = {
        buffer: '', previous: '', quote: false, tokens: []
    };

    for (const c of source.split('')) {
        if (state.quote) {
            if (c === '"' && state.previous != '\\' ) {
                state.quote = false;
                state.tokens.push({type: TokenType.STRING, value: state.buffer} as StringToken);
                state.buffer = '';
            } else {
                buffer(c, state, /[\r\n]/);
            }
        } else {
            if (c === ' ') {
                delimit(c, state, false);
            } else if (c === ':' || c === ';') {
                delimit(c, state, true);
            } else if (c === '"') {
                state.quote = true;
                delimit(c, state, false);
            } else {
                buffer(c, state, /\s/);
            }
        }

        state.previous = c;
    }

    if (state.quote) {
        throw new Error(`Expected double quote`);
    }
    delimit('', state, false);

    return state.tokens;
}

function buffer(c: string, state: TokenizerState, ignorePattern: RegExp) {
    if (!ignorePattern.test(c)) state.buffer += c;
}

function delimit(c: string, state: TokenizerState, keep: boolean) {
    if (state.buffer.length > 0) {
        state.tokens.push(parseToken(state.buffer));
        state.buffer = '';
    }
    if (keep) state.tokens.push(parseToken(c));
}

function tokenizeLine(source: string): Token[] {
    return [...source.split(/\s+/), '\n'].map(parseToken);
}

// todo clean up this mess and rethink the token/ast types
function parseToken(token: string): Token {
    if (token === '\n') {
        return {type: TokenType.NEW_LINE} as SymbolToken;
    } else if (token === ':') {
        return {type: TokenType.FUNCTION_START} as SymbolToken;
    } else if (token === ';') {
        return {type: TokenType.SEMICOLON} as SymbolToken;
    } else if (token.toLowerCase() === 'if') {
        return {type: TokenType.IF} as SymbolToken;
    } else if (token.toLowerCase() === 'then') {
        return {type: TokenType.THEN} as SymbolToken;
    } else if (token.toLowerCase() === 'else') {
        return {type: TokenType.ELSE} as SymbolToken;
    } else if (token.toLowerCase() === 'begin') {
        return {type: TokenType.BEGIN} as SymbolToken;
    } else if (token.toLowerCase() === 'until') {
        return {type: TokenType.UNTIL} as SymbolToken;
    } else if (isNaN(+token)) {
        return {type: TokenType.WORD, value: token} as WordToken;
    } else {
        return {type: TokenType.NUMBER, value: +token} as NumberToken;
    }
}
