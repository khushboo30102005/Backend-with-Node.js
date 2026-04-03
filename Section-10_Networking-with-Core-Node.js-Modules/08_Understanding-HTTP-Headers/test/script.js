const response = await fetch('http://192.168.31.13:4000')
/* 
// console.log(response.body)
for await (const chunk of response.body){
  console.log(chunk)
} */
 
console.log(response.headers)  
response.headers.forEach((val, key) => {
  console.log(key+ ': ' + val)
})