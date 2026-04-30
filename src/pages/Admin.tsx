import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Basic redirect - should check auth in a real app
    const isAdmin = localStorage.getItem('isAdmin');
    if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/admin/login');
    }
  }, [navigate]);

  return <div className="h-screen flex items-center justify-center">Loading Node...</div>;
}
