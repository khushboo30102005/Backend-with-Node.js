const res = await fetch('http://localhost:4000/');
// console.log(res.body)   this is readableStream
console.time();
let i = 0;
const decoder = new TextDecoder();
for await (const chunk of res.body) {
  i++;
  console.log(decoder.decode(chunk));
  if (i === 1) console.timeEnd();
}
