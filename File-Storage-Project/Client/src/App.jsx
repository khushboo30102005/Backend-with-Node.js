import { createBrowserRouter, RouterProvider } from 'react-router';
import DirectoryView from './DirectoryView';
import Register from './Register';
import './App.css';
import Login from './Login';
import UsersPage from './UsersPage';
import RootRoute from './RootRoute';
import SharedWithMe from './components/SharedWithMe';
import Layout from './components/Layout';
import TrashPage from './TrashPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRoute />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/users',
    element: <UsersPage />,
  },
  {
    path: '/directory/:dirId',
    element: <Layout><DirectoryView /></Layout>,
  },
  {
    path: '/shared-with-me',
    element: <Layout><SharedWithMe /></Layout>,
  },
  {
    path: '/trash',
    element: (
      <Layout>
        <TrashPage />
      </Layout>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
