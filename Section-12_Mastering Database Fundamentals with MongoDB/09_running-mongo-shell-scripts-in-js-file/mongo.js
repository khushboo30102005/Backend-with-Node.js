use("todoApp");
// db.todos.insertOne({ title: "Complete Node.js", completed: false });
const todosCollection = db.getCollection("todos");
for (let i = 1; i <= 10; i++) {
  todosCollection.insertOne({
    title: `Task ${i}`,
    completed: i % 2 === 0 ? true : false,
  });
}
console.log(db.todos.find());
