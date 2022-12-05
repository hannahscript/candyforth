import {
    BeginUntilLoop,
    Fragment,
    FragmentType,
    Function,
    IfCondition,
    NumberToken,
    Program,
    StringToken,
    Token,
    TokenType,
    WordToken
} from "../parser/fragments";

const base = (memory: string, stackStartIndex: string, stdlib: string, usercode: string) => `(module
    (import "env" "memory" (memory 256))
    (import "env" "log" (func $logf32 (param f32)))
    (import "env" "log" (func $logi32 (param i32)))
    (import "env" "logstr" (func $logstr (param i32) (param i32)))
    ${memory}
    (global $SI (mut i32) (i32.const ${stackStartIndex}))
    (func $pushf32 (param $v f32)
        (set_global $SI
            (i32.add
                (get_global $SI)
                (i32.const 4)
            )
        )
        (f32.store (get_global $SI) (get_local $v))
    )
    (func $popf32 (result f32)
        (f32.load (get_global $SI))
        (set_global $SI
            (i32.sub
                (get_global $SI)
                (i32.const 4)
            )
        )
    )
    (func $pushi32 (param $v i32)
        (set_global $SI
            (i32.add
                (get_global $SI)
                (i32.const 4)
            )
        )
        (i32.store (get_global $SI) (get_local $v))
    )
    (func $popi32 (result i32)
        (i32.load (get_global $SI))
        (set_global $SI
            (i32.sub
                (get_global $SI)
                (i32.const 4)
            )
        )
    )
    
    (func $ifn_dup
        (f32.load (get_global $SI))
        (call $pushf32)
    )
    (func $ifn_pop
        (set_global $SI
            (i32.sub
                (get_global $SI)
                (i32.const 4)
            )
        )
    )
    (func $ifn_swap (local $a f32)(local $b f32)(set_local $a (call $popf32))(set_local $b (call $popf32))(call $pushf32 (get_local $a))(call $pushf32 (get_local $b)))
        
    (; Standard functions ;)    
    
    ${stdlib}
    
    (; User code ;)    
    
    ${usercode}

    (export "main" (func $ufn_main))
)`;

function createWord(internalName: string, input: string[], output: string[], code: string, commutative=false) {
    let pop;
    if (commutative || input.length <= 1) {
        pop = input
            .map(type => `(call $pop${type})`)
            .join('');
    } else {
        const locals = input
            .map((type, i) => `(local $L${i} ${type})`)
            .join('');
        const pops = input
            .map((type, i) => `(local.set $L${i} (call $pop${type}))`)
            .join('');
        const reversePushImplicit = [];
        for (let i = input.length - 1; i >= 0; i--) reversePushImplicit.push(`(local.get $L${i})`)
        pop = `${locals}${pops}${reversePushImplicit.join('')}`
    }

    const push = output
        .map(type => `(call $push${type})`)
        .join('');

    return {
        internalName,
        code: `(func $ifn_${internalName} ${pop}${code}${push})`
    };
}

function useExistingFunction(internalName: string): WordDefinition {
    return {internalName};
}

type WordDefinition = {internalName: string, code?: string};
const functionTable: {[name: string]: WordDefinition} = {
    // Maths
    '+': createWord('add', ['f32', 'f32'], ['f32'], '(f32.add)', true),
    '-': createWord('sub', ['f32', 'f32'], ['f32'], '(f32.sub)'),
    '*': createWord('mul', ['f32', 'f32'], ['f32'], '(f32.mul)', true),
    '/': createWord('div', ['f32', 'f32'], ['f32'], '(f32.div)'),
    'abs': createWord('abs', ['f32'], ['f32'], '(f32.abs)'),
    'sqrt': createWord('sqrt', ['f32'], ['f32'], '(f32.sqrt)'),

    // Conditional
    '<': createWord('lt', ['f32', 'f32'], ['i32'], '(f32.lt)'),
    '>': createWord('gt', ['f32', 'f32'], ['i32'], '(f32.gt)'),
    '=': createWord('eq', ['f32', 'f32'], ['i32'], '(f32.eq)', true),

    // Stack manipulation
    'drop': useExistingFunction('drop'),
    'swap': useExistingFunction('swap'),
    'dup': useExistingFunction('dup'),

    // IO
    'printf32':  createWord('logf32', ['f32'], [], '(call $logf32)'),
    'printi32':  createWord('logi32', ['i32'], [], '(call $logi32)'),
    'printstr':  createWord('logstr', ['i32', 'i32'], [], '(call $logstr)'),
};

interface EmitterState {
    staticMemoryPointer: number,
    existingStrings: Map<string, number>
}

export class Emitter {
    private state: EmitterState;

    constructor() {
        this.state = {
            staticMemoryPointer: 0,
            existingStrings: new Map<string, number>()
        };
    }

    addStringToStaticMemory(str: string): number {
        if (this.state.existingStrings.has(str)) {
            return this.state.existingStrings.get(str) as number;
        }

        const location = this.state.staticMemoryPointer;
        this.state.staticMemoryPointer += str.length;
        this.state.existingStrings.set(str, location);
        return location;
    }

    emit(program: Program): string {
        const standardFunctionDefinitions = Object.values(functionTable)
            .map(def => def.code)
            .join('\n');

        const functions = [];
        for (let fun of program.functions.values()) {
            functions.push(this.emitFunction(fun, program));
        }

        const memory = this.initMemory();
        const userFunctionDefinitions = functions.join('\n');
        const stackStartIndex = this.getStackStartIndex();
        return base(memory, stackStartIndex, standardFunctionDefinitions, userFunctionDefinitions);
    }

    private initMemory(): string {
        const sortedStrings = Array.from(this.state.existingStrings.entries())
            .sort((a, b) => a[1] - b[1]);

        return `(data (i32.const 0) "${sortedStrings.map(e=>e[0]).join('')}")`;
    }

    private getStackStartIndex(): string {
        const sortedStrings = Array.from(this.state.existingStrings.entries())
            .sort((a, b) => a[1] - b[1]);
        if (sortedStrings.length <= 0) return '-4';

        const lastString = sortedStrings[sortedStrings.length - 1];
        return String(lastString[1] + lastString[0].length - 4);
    }

    emitFunction(fun: Function, program: Program): string {
        const fragments = this.emitFragments(fun.fragments, program);
        return `(func $ufn_${fun.name} ${fragments})`;
    }

    emitFragments(frags: Fragment[], program: Program): string {
        return frags
            .map(frag => this.emitFragment(frag, program))
            .join('\n');
    }

    emitFragment(frag: Fragment, program: Program): string {
        if (frag.type === FragmentType.ATOM) {
            const atom = frag.value as Token;
            if (atom.type === TokenType.NUMBER) {
                return this.emitNumberFragment(atom as NumberToken);
            } else if (atom.type === TokenType.WORD) {
                return this.emitWordFragment(atom as WordToken, program);
            } else if (atom.type === TokenType.STRING) {
                return this.emitStringFragment(atom as StringToken);
            }

            throw new Error(`Unknown atom type: '${atom.type}'`);
        } else if (frag.type === FragmentType.IF_CONDITION) {
            const ifCondition = frag.value as IfCondition;
            return this.emitIfCondition(ifCondition, program);
        } else if (frag.type === FragmentType.BEGIN_UNTIL_LOOP) {
            const loop = frag.value as BeginUntilLoop;
            return this.emitBeginUntilLoop(loop, program);
        }

        throw new Error(`Unknown fragment type: '${frag.type}'`);
    }

    emitStringFragment(frag: StringToken): string {
        const location = this.addStringToStaticMemory(frag.value);
        return `(call $pushi32 (i32.const ${location}))(call $pushi32 (i32.const ${frag.value.length}))`;
    }

    emitNumberFragment(frag: NumberToken): string {
        return `(call $pushf32 (f32.const ${frag.value}))`;
    }

    emitWordFragment(frag: WordToken, program: Program): string {
        const def = functionTable[frag.value];
        if (def) {
            return `(call $ifn_${def.internalName})`;
        } else if (program.functions.has(frag.value)) {
            return `call $ufn_${frag.value}`
        }

        throw new Error(`Unknown word: '${frag.value}'`);
    }

    emitIfCondition(ifCondition: IfCondition, program: Program): string {
        const consequences = this.emitFragments(ifCondition.then, program);
        const altConsequences = ifCondition.otherwise ? this.emitFragments(ifCondition.otherwise, program): '';
        return `(call $popi32) (if (then ${consequences}) (else ${altConsequences}))`;
    }

    emitBeginUntilLoop(loop: BeginUntilLoop, program: Program): string {
        const body = this.emitFragments(loop.body, program);
        return `(loop $loop1 ${body} (i32.sub (i32.const 1) (call $popi32)) (br_if $loop1))`;
    }
}


