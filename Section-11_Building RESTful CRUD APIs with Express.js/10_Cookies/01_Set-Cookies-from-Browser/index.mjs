// const response = await fetch('http://localhost:4000/',{
//   credentials: "include"
// })
// const data = await response
// console.log(data)

const xhr = new XMLHttpRequest()
xhr.withCredentials = true

xhr.open('GET', 'http://localhost:4000/', true)

xhr.send()