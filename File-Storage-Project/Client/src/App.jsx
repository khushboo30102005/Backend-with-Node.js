import {
  createBrowserRouter,
  RouterProvider,
  Link,
  Navigate,
  useParams,
} from 'react-router';
import MyDrive from './DirectoryView';
import Register from './Register';
import './App.css';
import Login from './Login';
import UsersPage from './UsersPage';
import RootRoute from './RootRoute';
import SharedWithMe from './components/SharedWithMe';
import Layout from './components/Layout';
import TrashPage from './TrashPage';

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
      <h1 className="text-2xl font-bold text-text">Page not found</h1>
      <p className="text-sm text-text-muted">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/mydrive"
        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
      >
        Go to My Drive
      </Link>
    </div>
  );
}

// Old bookmarks: /directory/:id → /mydrive/folder/:id
function LegacyFolderRedirect() {
  const { dirId } = useParams();
  return <Navigate to={`/mydrive/folder/${dirId}`} replace />;
}

const router = createBrowserRouter([
  { path: '/', element: <RootRoute /> },
  { path: '/register', element: <Register /> },
  { path: '/login', element: <Login /> },
  { path: '/users', element: <UsersPage /> },

  // Signed-in app shell: Layout mounts once; pages swap inside its <Outlet />.
  {
    element: <Layout />,
    children: [
      { path: 'mydrive/*', element: <MyDrive /> }, // /mydrive and /mydrive/folder/:id
      { path: 'shared', element: <SharedWithMe /> },
      { path: 'trash', element: <TrashPage /> },
    ],
  },

  // Legacy URLs
  { path: '/directory/:dirId', element: <LegacyFolderRedirect /> },
  { path: '/shared-with-me', element: <Navigate to="/shared" replace /> },

  { path: '*', element: <NotFound /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;