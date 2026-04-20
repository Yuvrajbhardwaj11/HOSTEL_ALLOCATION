import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, DoorOpen, GitBranch, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/rooms', label: 'Rooms', icon: DoorOpen },
  { to: '/allocations', label: 'Allocations', icon: GitBranch },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const pageTitles = {
    '/': 'Dashboard',
    '/students': 'Student Management',
    '/rooms': 'Room Management',
    '/allocations': 'Allocation Management',
  };
  const currentPath = window.location.pathname;
  const title = pageTitles[currentPath] || 'Hostel System';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Hostel<span>OS</span></h1>
          <p>Allocation System</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <h2 className="topbar-title">{title}</h2>
          <div className="topbar-actions">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Academic Year 2024–25
            </span>
          </div>
        </header>
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
