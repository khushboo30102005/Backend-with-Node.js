import { Buffer , constants} from 'node:buffer';

console.log(constants)



console.log(Buffer.poolSize); // 8192   -> 8kb
// Buffer.poolSize = 10000 
// console.log(Buffer.poolSize)   //10000


// const a = Buffer.alloc(494967296); 
// const d= Buffer.from('a'.repeat(536870888))
// const a= d.toString()
// const z = Buffer.alloc(4);
// const joinBuffer = Buffer.concat([a, z])

// const b = Buffer.allocUnsafe(4095);
// const c = Buffer.allocUnsafe(3417); // 8192 -4095-680 | Another Buffer Pool Created
// const d= Buffer.from('abc')
// b[0] = 97;
// c[0] = 101;
// /* console.log(a.byteLength);
// console.log(b.byteLength);
// console.log('*************************');
// console.log(a.buffer.byteLength);
// console.log(b.buffer.byteLength); */

// console.log(d.buffer === c.buffer);


// allocUnsafeSlow()

const E = Buffer.allocUnsafe(4)
const F = Buffer.allocUnsafeSlow(4)

console.log(E.byteLength)
console.log(F.byteLength)