import React from 'react';
import { Outlet } from 'react-router';

/**
 * MainLayout Component
 * Wrapper layout for all pages with dark theme
 */

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--echo-dark-bg)]">
      <Outlet />
    </div>
  );
};