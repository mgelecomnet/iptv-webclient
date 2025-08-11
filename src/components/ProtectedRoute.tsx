import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoggedIn, loading } = useAuth();

  // اگر در حال بارگذاری هستیم، یک صفحه لودینگ نمایش دهیم
  if (loading) {
    return <Loading />;
  }

  // اگر کاربر لاگین نکرده باشد، به صفحه لاگین هدایت شود
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // اگر کاربر لاگین کرده باشد، محتوای اصلی را نمایش دهیم
  return children;
};

export default ProtectedRoute;