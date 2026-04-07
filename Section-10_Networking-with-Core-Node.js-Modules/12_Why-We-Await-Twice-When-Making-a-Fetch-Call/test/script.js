const response = await fetch('http://192.168.31.13:4000'); // resolve after \n\n
console.log(response);

/* const data = await response.text()  // resolve after trigger end event on socket
console.log(data) */

// For resolve data immediately:

const decoder = new TextDecoder();

for await (const chunk of response.body) {
  // console.log(JSON.parse(decoder.decode(chunk)))
  // console.log(chunk)
  document.write(decoder.decode(chunk));
}
