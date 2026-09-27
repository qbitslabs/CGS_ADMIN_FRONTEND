/* Admin chrome layout: AuthLayout.
 * Shell around platform-admin routes (nav, auth, or content frame). */
import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100vw',
        backgroundColor: '#090d16',
        backgroundImage: 'radial-gradient(ellipse at 50% 10%, rgba(14, 165, 233, 0.15), transparent 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <Outlet />
      </div>
    </div>
  );
};
