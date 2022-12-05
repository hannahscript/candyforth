import {
    BeginUntilLoop,
    Fragment,
    FragmentType,
    Function,
    IfCondition,
    Program, StringToken,
    Token,
    TokenType,
    WordToken
} from "./fragments";
import util from 'util';
import {tokenize} from './tokenizer';

/*
    program := <function> +
    function := ':' WORD <fragment>+ '\n'
    word := / [a-zA-Z][a-zA-Z0-9]* /
    fragment := <word> | <number>
    number := / -?[0-9]+ /
*/

export class Parser {


    parse(source: string): Program {
        const tokens = tokenize(source);
        console.log(util.inspect(tokens, {depth: null, colors: true}));

        return this.parseProgram(tokens);
    }

    parseProgram(tokens: Token[]): Program {
        const functions = new Map<string, Function>();
        while (hasTokens(tokens)) {
            const fun = this.parseFunction(tokens);
            functions.set(fun.name, fun);
        }

        return {functions};
    }

    parseFunction(tokens: Token[]): Function {
        expectToken(TokenType.FUNCTION_START, tokens);
        const functionName = expectToken(TokenType.WORD, tokens) as WordToken;

        const {fragments} = this.readFragmentsUntil([TokenType.SEMICOLON], tokens);

        if (fragments.length <= 0) {
            throw new Error(`Empty function body for function '${functionName.value}'`);
        }

        return {name: functionName.value, fragments};
    }

    parseFragment(tokens: Token[]): Fragment {
        const next = peekToken(tokens);
        if (next.type === TokenType.IF) {
            const ifCondition = this.parseIfCondition(tokens);
            return {type: FragmentType.IF_CONDITION, value: ifCondition};
        } else if (next.type === TokenType.BEGIN) {
            const beginUntilLoop = this.parseBeginUntilLoop(tokens);
            return {type: FragmentType.BEGIN_UNTIL_LOOP, value: beginUntilLoop};
        } else if (next.type === TokenType.WORD || next.type === TokenType.NUMBER || next.type === TokenType.STRING) {
            const atom = nextToken(tokens);
            return {type: FragmentType.ATOM, value: atom} as Fragment;
        } else {
            throw new Error(`Unexpected token type '${next.type}', expected token of kind ATOM or STRUCTURAL`);
        }
    }

    parseBeginUntilLoop(tokens: Token[]): BeginUntilLoop {
        expectToken(TokenType.BEGIN, tokens);

        const {fragments} = this.readFragmentsUntil([TokenType.UNTIL], tokens);
        if (fragments.length <= 0) {
            throw new Error(`Empty loop body for begin/until statement}'`);
        }

        return {body: fragments};
    }

    parseIfCondition(tokens: Token[]): IfCondition {
        expectToken(TokenType.IF, tokens);

        const {fragments: thenFragments, lastToken} = this.readFragmentsUntil([TokenType.ELSE, TokenType.THEN], tokens);
        if (thenFragments.length <= 0) {
            throw new Error(`Empty consequence body for if statement}'`);
        }

        if (lastToken.type === TokenType.ELSE) {
            const {fragments: elseFragments} = this.readFragmentsUntil([TokenType.THEN], tokens);
            if (thenFragments.length <= 0) {
                throw new Error(`Empty alternative consequence body for if statement}'`);
            }
            return {then: thenFragments, otherwise: elseFragments};
        } else {
            return {then: thenFragments};
        }
    }

    readFragmentsUntil(oneOfType: TokenType[], tokens: Token[]): {fragments: Fragment[], lastToken: Token} {
        const fragments = [];
        let next = peekToken(tokens);
        while (!oneOfType.includes(next.type)) {
            const fragment = this.parseFragment(tokens);
            fragments.push(fragment);
            next = peekToken(tokens);
        }

        const lastToken = nextToken(tokens);
        return {fragments, lastToken};
    }
}

function hasTokens(tokens: Token[]) {
    return tokens.length > 0;
}

function nextToken(tokens: Token[]): Token {
    if (tokens.length <= 0) throw new Error(`Unexpected EOF, expected token`);
    return tokens.shift()!;
}

function peekToken(tokens: Token[]): Token {
    if (tokens.length <= 0) throw new Error(`Unexpected EOF, expected token`);
    return tokens[0];
}

function expectToken(type: TokenType, tokens: Token[]): Token {
    if (tokens.length <= 0) throw new Error(`Unexpected EOF, expected token type '${type}'`);
    const token = tokens.shift();
    if (token!.type !== type) throw new Error(`Unexpected token type '${token!.type}', expected '${type}'`);
    return token!;
}

function expectOneOfToken(types: TokenType[], tokens: Token[]): Token {
    if (tokens.length <= 0) throw new Error(`Unexpected EOF, expected one token type: ${types.join(', ')}`);
    const token = tokens.shift();
    if (!types.includes(token!.type)) throw new Error(`Unexpected token type '${token!.type}', expected one of: '${types.join(', ')}'`);
    return token!;
}
