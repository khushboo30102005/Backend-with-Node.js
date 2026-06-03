import React from 'react';
import Layout from './layout';

export default ({ todos }) => {
  console.log(todos);
  return (
    <Layout title="Todo List">
      <form action="/todos" method="POST">
        <input type="text" name="title" required placeholder="Add a new todo..." />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.reverse().map(({ _id, title, Completed }) => (
          <li key={_id.toString()}>
            <span
              style={{ textDecoration: Completed ? 'line-through' : 'none' }}
            >
              {title}
            </span>{' '}
              <button data-id={_id.toString()} className="delete-btn">delete</button>
          </li>
        ))}
      </ul>
    </Layout>
  );
};
