import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navRef = useRef(null);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // GSAP animation for navbar entrance
    gsap.fromTo(navRef.current, 
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
    );
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    // GSAP animation for theme toggle
    gsap.to('.theme-toggle', { rotation: 360, duration: 0.5, ease: 'back.out(1.7)' });
  };

  const handleLogout = () => {
    // GSAP animation for logout button
    gsap.to('.btn-ghost', { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut' });
    setTimeout(() => {
      logout();
      navigate('/login', { replace: true });
    }, 200);
  };

  return (
    <nav className="navbar" ref={navRef}>
      <div className="nav-inner">
        <div className="brand">EMP Payroll</div>

        <div className="nav-links">
          <NavLink to="/dashboard" className="nav-link">
            Dashboard
          </NavLink>
          <NavLink to="/contact" className="nav-link">
            Contact
          </NavLink>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <div
                className="nav-user"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ color: 'var(--nav-text)', fontWeight: 600 }}>
                  {user.name}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost"
                style={{ padding: '6px 10px', borderRadius: 8 }}
                title="Logout"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="nav-link">
              Login
            </NavLink>
          )}

          <button
            aria-label="Toggle theme"
            className="theme-toggle"
            onClick={toggleTheme}
            title="Toggle dark / light"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
}
