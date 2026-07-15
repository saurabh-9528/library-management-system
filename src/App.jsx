import React, { useState, useEffect } from 'react';
import { 
  Library, 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Sun,
  Moon,
  Search,
  Bookmark,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import BookCatalog from './components/BookCatalog';
import MemberRegistry from './components/MemberRegistry';
import TransactionTracker from './components/TransactionTracker';
import BookReservations from './components/BookReservations';

// APIs
import { login, register as registerUser, logout } from './api/authApi';
import { getBooks } from './api/booksApi';
import { getMembers } from './api/membersApi';
import { getTransactionHistory } from './api/transactionsApi';

import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notification, setNotification] = useState(null);
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('lumina_theme') || 'dark');

  // Auth states
  const [token, setToken] = useState(localStorage.getItem('lumina_auth_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('lumina_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  });

  // Auth Form states
  const [isLoginView, setIsLoginView] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  // Search states
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ books: [], members: [], transactions: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchOpenBookId, setSearchOpenBookId] = useState(null);
  const [searchOpenMemberId, setSearchOpenMemberId] = useState(null);

  // Sync theme
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('lumina_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Live search effect using backend APIs
  useEffect(() => {
    if (!token) return;
    if (globalSearchTerm.trim().length < 2) {
      setSearchResults({ books: [], members: [], transactions: [] });
      setShowSearchDropdown(false);
      return;
    }

    const performSearch = async () => {
      try {
        const query = globalSearchTerm.toLowerCase();
        
        // Fetch data from backend concurrently
        const [allBooks, allMembers, allTxns] = await Promise.all([
          getBooks({ search: query }),
          getMembers({ search: query }),
          getTransactionHistory()
        ]);

        const matchedBooks = allBooks.slice(0, 4);
        const matchedMembers = allMembers.slice(0, 4);

        const matchedTxns = allTxns.filter(t => {
          const bookTitle = t.bookId?.title || '';
          const memberName = t.memberId?.name || '';
          const membershipId = t.memberId?.membershipId || '';
          const txnId = t._id || '';

          return (
            txnId.toLowerCase().includes(query) ||
            bookTitle.toLowerCase().includes(query) ||
            memberName.toLowerCase().includes(query) ||
            membershipId.toLowerCase().includes(query)
          );
        }).map(t => ({
          ...t,
          id: t._id,
          bookTitle: t.bookId?.title || 'Unknown',
          memberName: t.memberId?.name || 'Unknown',
          borrowDate: t.issueDate ? t.issueDate.split('T')[0] : ''
        })).slice(0, 4);

        setSearchResults({
          books: matchedBooks,
          members: matchedMembers,
          transactions: matchedTxns
        });
        setShowSearchDropdown(true);
      } catch (e) {
        console.error("Global search error:", e);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [globalSearchTerm, token]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.global-search-container')) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (type, id) => {
    setShowSearchDropdown(false);
    setGlobalSearchTerm('');
    if (type === 'book') {
      setSearchOpenBookId(id);
      setActiveTab('books');
    } else if (type === 'member') {
      setSearchOpenMemberId(id);
      setActiveTab('members');
    } else if (type === 'transaction') {
      setActiveTab('transactions');
    }
  };

  // Keep time updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Utility to show global notifications
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (isLoginView) {
        if (!authForm.email || !authForm.password) {
          showNotification("Please fill in email and password.", "error");
          setAuthLoading(false);
          return;
        }
        const res = await login(authForm.email, authForm.password);
        showNotification("Welcome back to LuminaLib!");
        
        localStorage.setItem('lumina_auth_token', res.token);
        localStorage.setItem('lumina_user', JSON.stringify(res.data.user));
        
        setToken(res.token);
        setCurrentUser(res.data.user);
      } else {
        if (!authForm.name || !authForm.email || !authForm.password) {
          showNotification("Please fill in all registration fields.", "error");
          setAuthLoading(false);
          return;
        }
        if (authForm.password !== authForm.confirmPassword) {
          showNotification("Passwords do not match.", "error");
          setAuthLoading(false);
          return;
        }
        const res = await registerUser(authForm.name, authForm.email, authForm.password, 'admin');
        showNotification("Account registered successfully!");
        
        localStorage.setItem('lumina_auth_token', res.token);
        localStorage.setItem('lumina_user', JSON.stringify(res.data.user));
        
        setToken(res.token);
        setCurrentUser(res.data.user);
      }
      setAuthForm({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || "Authentication failed.";
      showNotification(msg, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Error clearing backend session:", e);
    } finally {
      localStorage.removeItem('lumina_auth_token');
      localStorage.removeItem('lumina_user');
      setToken(null);
      setCurrentUser(null);
      showNotification("Logged out successfully.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} showNotification={showNotification} />;
      case 'books':
        return <BookCatalog showNotification={showNotification} initialBookId={searchOpenBookId} clearInitialBookId={() => setSearchOpenBookId(null)} />;
      case 'members':
        return <MemberRegistry showNotification={showNotification} initialMemberId={searchOpenMemberId} clearInitialMemberId={() => setSearchOpenMemberId(null)} />;
      case 'transactions':
        return <TransactionTracker showNotification={showNotification} />;
      case 'reservations':
        return <BookReservations showNotification={showNotification} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} showNotification={showNotification} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'books': return 'Book Catalog';
      case 'members': return 'Member Registry';
      case 'transactions': return 'Borrow & Return System';
      case 'reservations': return 'Book Reservations';
      default: return 'Lumina Library';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Overview of library inventory, active checkouts, and metrics.';
      case 'books': return 'Search, filter, edit, and add to the library\'s books.';
      case 'members': return 'Manage active library members, credentials, and loan logs.';
      case 'transactions': return 'Issue new books, log returns, calculate fees, and review histories.';
      case 'reservations': return 'Reserve books in advance, manage queues, and process reservation loans.';
      default: return 'Welcome back, Administrator.';
    }
  };

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  // ----------------------------------------------------
  // Unauthenticated View (Login/Register Card)
  // ----------------------------------------------------
  if (!token) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
        <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
          <div className="logo-container" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div className="logo-icon">
              <Library size={28} />
            </div>
            <span className="logo-text" style={{ fontSize: '1.6rem' }}>LuminaLib</span>
          </div>

          <h2 style={{ textAlign: 'center', color: 'white', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            {isLoginView ? 'Sign In to Portal' : 'Register Administrator'}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {isLoginView ? 'Enter credentials to manage library inventory.' : 'Set up a librarian or admin account.'}
          </p>

          <form onSubmit={handleAuthSubmit}>
            {!isLoginView && (
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Sarah Connor"
                  className="form-control"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="e.g., admin@lumina.com"
                className="form-control"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="form-control"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>

            {!isLoginView && (
              <div className="form-group">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="form-control"
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                />
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
              disabled={authLoading}
            >
              {authLoading ? 'Authenticating...' : isLoginView ? 'Login' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isLoginView ? "Don't have an admin account? " : "Already have an account? "}
            </span>
            <button 
              type="button"
              onClick={() => {
                setIsLoginView(!isLoginView);
                setAuthForm({ name: '', email: '', password: '', confirmPassword: '' });
              }}
              style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              {isLoginView ? 'Register here' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className={`notification-toast ${notification.type}`}>
            {notification.type === 'success' ? (
              <CheckCircle2 size={20} color="var(--color-success)" />
            ) : (
              <AlertCircle size={20} color="var(--color-danger)" />
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{notification.message}</span>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // Authenticated View
  // ----------------------------------------------------
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">
            <Library size={24} />
          </div>
          <span className="logo-text">LuminaLib</span>
        </div>

        <nav>
          <ul className="nav-links">
            <li 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </li>
            <li 
              className={`nav-item ${activeTab === 'books' ? 'active' : ''}`}
              onClick={() => setActiveTab('books')}
            >
              <BookOpen size={18} />
              <span>Book Catalog</span>
            </li>
            <li 
              className={`nav-item ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Users size={18} />
              <span>Member Registry</span>
            </li>
            <li 
              className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <ArrowLeftRight size={18} />
              <span>Borrow & Return</span>
            </li>
            <li 
              className={`nav-item ${activeTab === 'reservations' ? 'active' : ''}`}
              onClick={() => setActiveTab('reservations')}
            >
              <Bookmark size={18} />
              <span>Reservations</span>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer" style={{ flexDirection: 'column', gap: '0.75rem', alignItems: 'stretch' }}>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <UserIcon size={14} color="var(--color-secondary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </span>
            </div>
          )}
          <button 
            className="btn btn-secondary" 
            onClick={handleLogout}
            style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center', gap: '0.4rem', border: '1px solid rgba(244, 63, 94, 0.2)', color: 'var(--color-danger)', background: 'rgba(244, 63, 94, 0.02)' }}
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="main-wrapper">
        <header className="header">
          <div className="header-title-section">
            <h1>{getPageTitle()}</h1>
            <p>{getPageSubtitle()}</p>
          </div>
          
          {/* Global Search Bar */}
          <div className="global-search-container">
            <div className="global-search-input-wrapper">
              <Search size={16} className="global-search-icon" />
              <input 
                type="text" 
                placeholder="Search books, members, txns..."
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                onFocus={() => globalSearchTerm.trim().length >= 2 && setShowSearchDropdown(true)}
              />
              {globalSearchTerm && (
                <button className="global-search-clear-btn" onClick={() => setGlobalSearchTerm('')}>
                  &times;
                </button>
              )}
            </div>

            {/* Global Search Dropdown */}
            {showSearchDropdown && (
              <div className="global-search-dropdown">
                {searchResults.books.length === 0 && searchResults.members.length === 0 && searchResults.transactions.length === 0 ? (
                  <div className="global-search-no-results">No matches found.</div>
                ) : (
                  <>
                    {/* Books results */}
                    {searchResults.books.length > 0 && (
                      <div className="global-search-section">
                        <div className="global-search-section-title">Books</div>
                        {searchResults.books.map(b => (
                          <div key={b._id} className="global-search-item" onClick={() => handleSearchResultClick('book', b._id)}>
                            <div className="global-search-item-info">
                              <span className="global-search-item-name">{b.title}</span>
                              <span className="global-search-item-sub">by {b.author} • ISBN: {b.isbn}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Members results */}
                    {searchResults.members.length > 0 && (
                      <div className="global-search-section">
                        <div className="global-search-section-title">Members</div>
                        {searchResults.members.map(m => (
                          <div key={m._id} className="global-search-item" onClick={() => handleSearchResultClick('member', m._id)}>
                            <div className="global-search-item-info">
                              <span className="global-search-item-name">{m.name}</span>
                              <span className="global-search-item-sub">{m.email} • ID: {m.membershipId}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Transactions results */}
                    {searchResults.transactions.length > 0 && (
                      <div className="global-search-section">
                        <div className="global-search-section-title">Transactions</div>
                        {searchResults.transactions.map(t => (
                          <div key={t.id} className="global-search-item" onClick={() => handleSearchResultClick('transaction', t.id)}>
                            <div className="global-search-item-info">
                              <span className="global-search-item-name">{t.bookTitle} &rarr; {t.memberName}</span>
                              <span className="global-search-item-sub">ID: {t.id} • Date: {t.borrowDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="header-meta">
            {/* Theme Toggle Button */}
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="time-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={14} />
              <span>{formattedDate} - {formattedTime}</span>
            </div>
          </div>
        </header>

        <main className="content-container">
          {renderContent()}
        </main>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.type === 'success' ? (
            <CheckCircle2 size={20} color="var(--color-success)" />
          ) : (
            <AlertCircle size={20} color="var(--color-danger)" />
          )}
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{notification.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
