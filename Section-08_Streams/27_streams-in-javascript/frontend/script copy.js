const input = document.querySelector('input');
const decoder = new TextDecoder();
input.addEventListener('change', async () => {
  const file = input.files[0];
  const readStream = file.stream();
  for await (const chunk of readStream){
    console.log(chunk)
  }

  /* 
  const reader = readStream.getReader();
     while (1) {
    const {done, value} = await reader.read();
    if (done) break;
    console.log(decoder.decode(value));
  } */

  // const str = await file.text()
  // console.log(str);
});
