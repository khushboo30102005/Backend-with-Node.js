import './db.js';
import express from 'express';
import todoRoutes from './routes/todoRoutes.js';
import { createEngine } from 'express-react-views';

const app = express();

app.use(express.json()); // parse incoming JSON data in request bodies and make it available under req.body
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.set('views', './views'); //express-react-views will look for template files in the views folder.
app.set('view engine', 'jsx'); // sets the default template file extension to jsx, so i can render templates without specifying the extension.
app.engine('jsx', createEngine()); // Whenever express find a jsx file, it will use createEngine() to render it.

app.use('/todos', todoRoutes); // this is a base URL for all routes defined in todoRoutes.

app.listen(4000, () => {
  console.log(`Server is running`);
});
