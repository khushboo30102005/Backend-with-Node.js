const response = await fetch('http://localhost:4000/api',{
  method:'PUT',
})
const data = await response.json()
console.log(data) 