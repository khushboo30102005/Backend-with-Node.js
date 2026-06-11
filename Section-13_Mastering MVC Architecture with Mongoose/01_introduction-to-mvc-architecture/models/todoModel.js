import { Schema , model} from 'mongoose';

const todoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    strict: 'throw',
  },
);

const Todo = model('Todo', todoSchema);

export default Todo;
