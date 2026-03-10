const a = new ArrayBuffer(4)
const uint8Array = new Uint8Array(a)
uint8Array[0] = 97
uint8Array[1] = 98
uint8Array[2] = 99
uint8Array[3] = 100



fetch('http://localhost:3000',
  {
    method: 'POST',
    body : uint8Array
  }
)
  .then((res) => res.text())
  .then((data) => console.log(data));
