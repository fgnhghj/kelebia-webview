import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function AppLayout() {
  usePushNotifications();

  return (
    <div className="app-layout">
      <div className="app-content">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
