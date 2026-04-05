const response = await fetch('http://192.168.31.13:4000')




for await (const chunk of response.body){
  console.log(chunk)
}
