### Store Int 32:
```js
 db.numbers.insertOne({a: 23})
``` 
### Store Int 64:
```js
 db.numbers.insertOne({a: 900719925474099132n})
 db.numbers.insertOne({a: NumberLong('900719925474099132')})
```
Store Double:
```js
 db.numbers.insertOne({a: 5.4})
 db.numbers.insertOne({a: NumberDouble(3.14)})
``` 
Store Decimal128:
```js
 db.numbers.insertOne({a: NumberDecimal('4567.35648357954345678')})
``` 