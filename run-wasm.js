const fs = require('fs');

console.log(`Running WASM file '${process.argv[2]}'`);
const buffer = fs.readFileSync(process.argv[2]);

const memory = new WebAssembly.Memory({initial: 256, maximum: 256});
WebAssembly.instantiate(buffer, {
    env: {
        memory,
        log(n) {
            console.log(n);
        },
        logstr(index, length) {
            console.log(String.fromCharCode.apply(null,
                new Uint8Array(memory.buffer, index, length)
            ))
        }
    }
}).then(module => {
    const { main } = module.instance.exports;
    const stack = main();
    console.log('Execution finished. Showing stack (16):\n', new Float32Array(memory.buffer, 0, 16).join('  '));
});
