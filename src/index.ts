import * as fs from 'fs/promises';
import {Parser} from "./parser/parser";
import {Emitter} from "./emitter/emitter";
import * as util from 'util';

// Hardcoded config (TODO move into command line args)
const INPUT_FILE = './cforth/test.cfs';
const OUT_FILE = './cforth/output.wat';

async function main() {
    logInfo(`Reading source file '${INPUT_FILE}' ...`);
    const source = await fs.readFile(INPUT_FILE, 'utf8');
    console.log(source);

    logInfo(`Parsing source ...`);
    const program = (new Parser()).parse(source);
    console.log(util.inspect(program, {depth: 99, colors: true}));

    console.log(`Compiling ...`)
    const emitter = new Emitter();
    const wat = emitter.emit(program);

    logInfo(`Done. Writing output to file '${OUT_FILE}'.`);
    return fs.writeFile(OUT_FILE, wat);
}

// TODO add colorful logging framework
function logInfo(text: any) {
    console.log(text);
}

main().then();
