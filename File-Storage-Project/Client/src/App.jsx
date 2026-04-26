import {createBrowserRouter, RouterProvider } from 'react-router-dom';
import DirView from './DirView';

const router = createBrowserRouter([
  {
    path: "/*",
    element: <DirView />,
  },
  {
    path: "/directory/:dirId",
    element: <DirView />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
