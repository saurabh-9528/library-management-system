import React, { useState, useEffect } from 'react';
import { 
  Book, 
  ArrowLeftRight, 
  AlertTriangle, 
  Users, 
  PlusCircle, 
  UserPlus, 
  CheckCircle,
  TrendingUp, 
  PieChart as PieIcon,
  X,
  Printer
} from 'lucide-react';
import { getStats, borrowBook, getTransactionHistory } from '../api/transactionsApi';
import { getBooks, addBook } from '../api/booksApi';
import { getMembers, addMember } from '../api/membersApi';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

const PIE_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Teal
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#14b8a6'  // Cyan
];

function Dashboard({ setActiveTab, showNotification }) {
  const [stats, setStats] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Form states
  const [issueForm, setIssueForm] = useState({ bookId: '', memberId: '', dueDate: '' });
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: 'Fiction', quantity: 1 });
  const [memberForm, setMemberForm] = useState({ name: '', email: '', phone: '' });

  // Load database stats, transactions, books, and members
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [currentStats, allTxns, allBooks, allMembers] = await Promise.all([
        getStats(),
        getTransactionHistory(),
        getBooks(),
        getMembers()
      ]);

      setStats(currentStats);
      setRecentTxns(allTxns.slice(0, 5)); // Show top 5 recent transactions
      setBooks(allBooks);
      setMembers(allMembers);
    } catch (e) {
      console.error("Error loading dashboard data:", e);
      showNotification("Could not load dashboard metrics.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Form handlers
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueForm.bookId || !issueForm.memberId || !issueForm.dueDate) {
      showNotification("Please fill in all checkout fields.", "error");
      return;
    }
    try {
      await borrowBook(issueForm.bookId, issueForm.memberId, issueForm.dueDate);
      showNotification("Book issued successfully!");
      setShowIssueModal(false);
      setIssueForm({ bookId: '', memberId: '', dueDate: '' });
      await loadDashboardData(); // Reload statistics
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      showNotification(msg, "error");
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author || !bookForm.isbn) {
      showNotification("Please fill in all book fields.", "error");
      return;
    }
    try {
      await addBook(bookForm);
      showNotification(`"${bookForm.title}" added to inventory.`);
      setShowBookModal(false);
      setBookForm({ title: '', author: '', isbn: '', category: 'Fiction', quantity: 1 });
      await loadDashboardData();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to add book.";
      showNotification(msg, "error");
    }
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.email || !memberForm.phone) {
      showNotification("Please fill in all member fields.", "error");
      return;
    }
    try {
      const newMember = await addMember(memberForm);
      showNotification(`Member "${memberForm.name}" registered with ID: ${newMember.membershipId}`);
      setShowMemberModal(false);
      setMemberForm({ name: '', email: '', phone: '' });
      await loadDashboardData();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to register member.";
      showNotification(msg, "error");
    }
  };

  if (loading && !stats) {
    return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading metrics dashboard...</div>;
  }

  if (!stats) {
    return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}>Failed to load stats. Check database connections.</div>;
  }

  // Fetch available books and active members for the issue form
  const availableBooks = books.filter(b => b.status === 'available');
  const activeMembers = members.filter(m => m.status === 'active');

  return (
    <div>
      {/* Print Only Header */}
      <div className="print-only-header">
        <h2>Lumina Library System</h2>
        <p>Dashboard Metrics & Summary Report — Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Dashboard Actions Toolbar */}
      <div className="toolbar" style={{ justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => window.print()} title="Print summary report">
          <Printer size={18} />
          <span>Print Report</span>
        </button>
      </div>

      {/* 4-Column Stat Bar */}
      <section className="dashboard-grid-stats">
        <div className="glass-card stat-card">
          <div className="stat-info">
            <h3>Total Books</h3>
            <div className="stat-number">{stats.totalBooks}</div>
          </div>
          <div className="stat-card-icon primary">
            <Book size={24} />
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-info">
            <h3>Active Loans</h3>
            <div className="stat-number">{stats.activeLoans}</div>
          </div>
          <div className="stat-card-icon secondary">
            <ArrowLeftRight size={24} />
          </div>
        </div>

        <div className="glass-card stat-card" style={{ cursor: stats.overdueLoans > 0 ? 'pointer' : 'default' }} onClick={() => stats.overdueLoans > 0 && setActiveTab('transactions')}>
          <div className="stat-info">
            <h3>Overdue Loans</h3>
            <div className="stat-number" style={{ color: stats.overdueLoans > 0 ? 'var(--color-danger)' : 'var(--text-main)' }}>{stats.overdueLoans}</div>
          </div>
          <div className="stat-card-icon warning" style={stats.overdueLoans > 0 ? {background: 'var(--grad-danger)'} : {}}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-info">
            <h3>Registered Members</h3>
            <div className="stat-number">{stats.totalMembers}</div>
          </div>
          <div className="stat-card-icon success">
            <Users size={24} />
          </div>
        </div>
      </section>

      {/* Row 2: Charts */}
      <section className="dashboard-charts-row">
        {/* Borrowing Trend Line/Bar Chart */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp size={18} color="var(--color-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Borrowing Volume Trend</h2>
          </div>
          <div style={{ width: '100%', height: '250px' }}>
            {stats.trendData && stats.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trendData}>
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
                    labelStyle={{ color: 'white', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="borrows" fill="url(#colorBorrows)" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    <defs>
                      <linearGradient id="colorBorrows" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No recent borrowing records to display.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <PieIcon size={18} color="var(--color-secondary)" />
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Category Distribution</h2>
          </div>
          <div style={{ width: '100%', height: '250px' }}>
            {stats.categoryData && stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No category breakdown data.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Row 3: Recent Activity & Quick Actions */}
      <section className="dashboard-footer-row">
        {/* Recent Transactions Feed */}
        <div className="glass-card">
          <h2>Recent Activity</h2>
          <div className="recent-activity-list">
            {recentTxns.length > 0 ? (
              recentTxns.map((txn) => {
                const isReturned = txn.returnDate !== null;
                const isOverdue = !isReturned && new Date() > new Date(txn.dueDate);
                
                const memberName = txn.memberId?.name || 'Unknown';
                const bookTitle = txn.bookId?.title || 'Unknown';
                const txnIdDisplay = txn._id ? txn._id.slice(-6).toUpperCase() : txn.id;
                
                return (
                  <div key={txn._id || txn.id} className="activity-item">
                    <div className={`activity-icon-dot ${isReturned ? 'return' : 'borrow'}`}>
                      {isReturned ? <CheckCircle size={16} /> : <ArrowLeftRight size={16} />}
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">
                        <strong>{memberName}</strong> {isReturned ? 'returned' : 'checked out'} <strong>{bookTitle}</strong>
                        {isOverdue && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 600 }}>(Overdue)</span>}
                      </div>
                      <div className="activity-time">
                        {txnIdDisplay} • {isReturned ? `Returned: ${txn.returnDate.split('T')[0]}` : `Issued: ${txn.issueDate.split('T')[0]}`}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                No recent activity logged.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-card">
          <h2>Quick Admin Actions</h2>
          <div className="quick-actions-box">
            <button className="quick-action-btn" onClick={() => setShowIssueModal(true)}>
              <div className="quick-action-icon" style={{ color: 'var(--color-secondary)', background: 'rgba(6, 182, 212, 0.1)' }}>
                <ArrowLeftRight size={20} />
              </div>
              <div className="quick-action-info">
                <h4>Issue Book (Checkout)</h4>
                <p>Register a book loan to an active member.</p>
              </div>
            </button>

            <button className="quick-action-btn" onClick={() => setShowBookModal(true)}>
              <div className="quick-action-icon">
                <PlusCircle size={20} />
              </div>
              <div className="quick-action-info">
                <h4>Add New Book</h4>
                <p>Add a new copy or catalog listing to the collection.</p>
              </div>
            </button>

            <button className="quick-action-btn" onClick={() => setShowMemberModal(true)}>
              <div className="quick-action-icon" style={{ color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)' }}>
                <UserPlus size={20} />
              </div>
              <div className="quick-action-info">
                <h4>Register New Member</h4>
                <p>Create a membership card for a library user.</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* MODAL: Issue Book */}
      {showIssueModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleIssueSubmit}>
            <button type="button" className="modal-close-btn" onClick={() => setShowIssueModal(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <ArrowLeftRight size={20} color="var(--color-secondary)" />
              Issue Book
            </h3>

            <div className="form-group">
              <label>Select Book</label>
              {availableBooks.length > 0 ? (
                <select 
                  className="form-control" 
                  value={issueForm.bookId}
                  onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Choose an available book --</option>
                  {availableBooks.map(b => (
                    <option key={b._id} value={b._id}>{b.title} ({b.isbn})</option>
                  ))}
                </select>
              ) : (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>No books currently available for checkout.</p>
              )}
            </div>

            <div className="form-group">
              <label>Select Member</label>
              {activeMembers.length > 0 ? (
                <select 
                  className="form-control" 
                  value={issueForm.memberId}
                  onChange={(e) => setIssueForm({ ...issueForm, memberId: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Choose active member --</option>
                  {activeMembers.map(m => (
                    <option key={m._id} value={m._id}>{m.name} ({m.membershipId})</option>
                  ))}
                </select>
              ) : (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>No active members registered.</p>
              )}
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={issueForm.dueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowIssueModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={availableBooks.length === 0 || activeMembers.length === 0}>Issue Loan</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Add Book */}
      {showBookModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleBookSubmit}>
            <button type="button" className="modal-close-btn" onClick={() => setShowBookModal(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <Book size={20} color="var(--color-primary)" />
              Add New Book
            </h3>

            <div className="form-group">
              <label>Book Title</label>
              <input 
                type="text" 
                placeholder="e.g., The Hobbit" 
                className="form-control" 
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Author Name</label>
              <input 
                type="text" 
                placeholder="e.g., J.R.R. Tolkien" 
                className="form-control" 
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ISBN Number</label>
                <input 
                  type="text" 
                  placeholder="13-digit code" 
                  className="form-control" 
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-control" 
                  value={bookForm.quantity}
                  onChange={(e) => setBookForm({ ...bookForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Category / Genre</label>
              <select 
                className="form-control" 
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="Fiction">Fiction</option>
                <option value="Science">Science</option>
                <option value="Technology">Technology</option>
                <option value="History">History</option>
                <option value="Fantasy">Fantasy</option>
                <option value="Self-Help">Self-Help</option>
                <option value="Biography">Biography</option>
                <option value="Mystery">Mystery</option>
                <option value="Sci-Fi">Sci-Fi</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowBookModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Book</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Register Member */}
      {showMemberModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleMemberSubmit}>
            <button type="button" className="modal-close-btn" onClick={() => setShowMemberModal(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <Users size={20} color="var(--color-success)" />
              Register Member
            </h3>

            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="e.g., Sarah Connor" 
                className="form-control" 
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="e.g., sarah@skynet.com" 
                className="form-control" 
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                placeholder="e.g., 555-0100" 
                className="form-control" 
                value={memberForm.phone}
                onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Register</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
