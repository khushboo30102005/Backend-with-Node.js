import User from './userModel.js';

// const query = User.find({ age: { $gte: 45 } });
const query = User.where('age')
  .gte(20)
  .lte(45)
  .select('name age email')
  .sort({ age: -1 })
  .exec(); // this will execute the query and return a promise that resolves to the result of the query. exec() is used to execute the query and return a promise that resolves to the result of the query.

/*    SELECT QUERY    */

// query.select('name age '); // this will select only the name, age, and email fields from the documents that match the query. select() is based on the projection parameter in MongoDB, which allows you to specify which fields to include or exclude in the result set. In this case, we are including the name, age, and email fields while excluding all other fields from the documents that match the query criteria. This is server side filtering, which means that the database will only return the specified fields for the matching documents, reducing the amount of data transferred over the network and improving performance.

// query.select({ name: 1, 'age,': 1, email: 1 })  // we can also use an object to specify the fields.

// const query = User.find({ email: 'ram@example.com' }, { name: 1, 'age,': 1, email: 1 }); // Also provide projection as the second argument.

// query.select('-name'); // this will exclude the name field from the result set.

// console.log(query.projection()); // return the projection object that is being used in the query: { name: 1, 'age,': 1, email: 1 }

/*    SORT    */
// query.select('name age ').sort('name');
// query.select('name age ').sort({age: -1}); // this will sort the results by age in descending order. Use 1 for ascending order and -1 for descending order.

/*    WHERE CLAUSE    */
// query.where('age').gt(18).lt(30); // this will find all users whose age is greater than 18 and less than 30.

// console.log(query.getQuery());
console.log(await query);
// console.log(await query.exec()); // this will execute the query and return the result. exec() is used to execute the query and return a promise that resolves to the result of the query.
