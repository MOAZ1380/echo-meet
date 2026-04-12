import { createBrowserRouter } from 'react-router';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { MeetingRoom } from './pages/MeetingRoom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetCode } from './pages/ResetCode';
import { NewPassword } from './pages/NewPassword';

/**
 * React Router Configuration
 * Defines all application routes
 */

export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: 'login',
        Component: Login,
      },
      {
        path: 'register',
        Component: Register,
      },
      {
        path: 'forgot-password',
        Component: ForgotPassword,
      },
      {
        path: 'reset-code',
        Component: ResetCode,
      },
      {
        path: 'new-password',
        Component: NewPassword,
      },
      {
        path: 'lobby/:meetingId',
        Component: Lobby,
      },
      {
        path: 'meeting/:meetingId',
        Component: MeetingRoom,
      },
    ],
  },
]);