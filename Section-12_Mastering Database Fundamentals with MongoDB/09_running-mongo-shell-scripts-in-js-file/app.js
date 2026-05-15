

console.log('hii from app.js')
// we get the access of mongodb  commands here because of the mongo shell environment

console.log(db)
/* console.log(show)
console.log(use) */

// use expenseApp in js : change the database to expenseApp

/* use("expenseApp");

console.log(db) */


//  create a collection called todos and insert some documents in it

use("todoApp")

// it works synchronously: 
// db.todos.insertOne({ title: "Complete MongoDB", completed: false })

// console.log(db.todos.find())

// db.getCollection("todos").insertOne({ title: "Complete MongoDB", completed: false })

const todosCollection = db.getCollection("todos")
for(let i = 1; i <=10; i++){
    todosCollection.insertOne({ title: `Task ${i}`, completed: i%2? true : false })
} 

console.log(db.getCollection("todos").find())