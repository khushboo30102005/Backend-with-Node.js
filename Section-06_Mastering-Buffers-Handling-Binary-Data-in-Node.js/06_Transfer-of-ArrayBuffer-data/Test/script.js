fetch('http://localhost:3000/')
  .then((res) => res.arrayBuffer())
  .then((data) => {
    console.log(data);
    const decoder = new TextDecoder('utf-8');
    console.log(decoder.decode(data));
  });
