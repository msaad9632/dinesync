// ==========================================
// Sidebar Navigation Component
// ==========================================
import { NavLink } from 'react-router-dom';

function Sidebar() {
  // Navigation items
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/tables', label: 'Tables', icon: '🪑' },
    { path: '/reservations', label: 'Reservations', icon: '📅' },
    { path: '/menu', label: 'Menu', icon: '🍽️' },
    { path: '/orders', label: 'Pre-Orders', icon: '🛒' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon" aria-hidden="true">🍴</div>
        <h1>DineSync</h1>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
