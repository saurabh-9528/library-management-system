import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  History,
  BookOpen,
  User 
} from 'lucide-react';
import { getBooks } from '../api/booksApi';
import { getMembers } from '../api/membersApi';
import { borrowBook, returnBook, getTransactionHistory } from '../api/transactionsApi';

function TransactionTracker({ showNotification }) {
  const [activeLoans, setActiveLoans] = useState([]);
  const [completedLoans, setCompletedLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Available drop downs
  const [availableBooks, setAvailableBooks] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  
  // Form checkout state
  const getDefaultDueDate = () => {
    const twoWeeks = Date.now() + 14 * 24 * 60 * 60 * 1000;
    return new Date(twoWeeks).toISOString().split('T')[0];
  };

  const [checkoutForm, setCheckoutForm] = useState({
    bookId: '',
    memberId: '',
    dueDate: getDefaultDueDate()
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Names cache maps
  const [booksMap, setBooksMap] = useState({});
  const [membersMap, setMembersMap] = useState({});

  const loadTransactionData = async () => {
    try {
      setLoading(true);
      const [books, members, txns] = await Promise.all([
        getBooks(),
        getMembers(),
        getTransactionHistory()
      ]);

      // Create lookup maps
      const bMap = {};
      books.forEach(b => { bMap[b._id || b.id] = b; });
      setBooksMap(bMap);

      const mMap = {};
      members.forEach(m => { mMap[m._id || m.id] = m; });
      setMembersMap(mMap);

      // Filter available books & active members
      setAvailableBooks(books.filter(b => b.status === 'available'));
      setActiveMembers(members.filter(m => m.status === 'active'));

      // Filter transactions into active and completed
      const active = [];
      const completed = [];

      txns.forEach(t => {
        const bookTitle = t.bookId?.title || bMap[t.bookId]?.title || t.bookId || 'Unknown';
        const bookAuthor = t.bookId?.author || bMap[t.bookId]?.author || 'Unknown';
        const memberName = t.memberId?.name || mMap[t.memberId]?.name || t.memberId || 'Unknown';
        
        const item = {
          id: t._id,
          bookId: t.bookId?._id || t.bookId,
          bookTitle,
          bookAuthor,
          memberId: t.memberId?._id || t.memberId,
          memberName,
          borrowDate: t.issueDate ? t.issueDate.split('T')[0] : '',
          dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
          returnDate: t.returnDate ? t.returnDate.split('T')[0] : null,
          fineAmount: t.fineAmount || 0
        };
        
        if (t.returnDate === null) {
          active.push(item);
        } else {
          completed.push(item);
        }
      });

      setActiveLoans(active);
      setCompletedLoans(completed);
    } catch (e) {
      console.error("Error loading transaction data:", e);
      showNotification("Could not load checkout histories.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactionData();
  }, []);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!checkoutForm.bookId || !checkoutForm.memberId || !checkoutForm.dueDate) {
      showNotification("Please select a book, member, and due date.", "error");
      return;
    }

    try {
      await borrowBook(checkoutForm.bookId, checkoutForm.memberId, checkoutForm.dueDate);
      
      const bookTitle = booksMap[checkoutForm.bookId]?.title || checkoutForm.bookId;
      const memberName = membersMap[checkoutForm.memberId]?.name || checkoutForm.memberId;
      
      showNotification(`Checked out "${bookTitle}" to ${memberName}.`);
      
      // Reset form
      setCheckoutForm({
        bookId: '',
        memberId: '',
        dueDate: getDefaultDueDate()
      });
      
      await loadTransactionData();
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      showNotification(msg, "error");
    }
  };

  const handleReturnClick = async (txnId, bookTitle) => {
    try {
      const txn = await returnBook(txnId);
      if (txn.fineAmount > 0) {
        showNotification(`Returned "${bookTitle}". Overdue Fine Charged: $${txn.fineAmount}.00`, "error");
      } else {
        showNotification(`"${bookTitle}" returned successfully. No fines.`);
      }
      await loadTransactionData();
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      showNotification(msg, "error");
    }
  };

  // Search filter across active and historical transactions
  const filteredActiveLoans = activeLoans.filter(l => 
    l.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompletedLoans = completedLoans.filter(l => 
    l.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const today = new Date().toISOString().split("T")[0];

  if (loading && activeLoans.length === 0 && completedLoans.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading transactions ledger...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Search bar */}
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <div className="search-input-wrapper" style={{ maxWidth: '100%' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search transactions by Book Title, Member Name, or Transaction ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="transaction-flow-layout">
        {/* Left Column: Checkout book form */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <ArrowLeftRight size={20} color="var(--color-primary)" />
            New Book Issue
          </h2>
          
          <form onSubmit={handleCheckoutSubmit}>
            <div className="form-group">
              <label>Select Book to Issue *</label>
              {availableBooks.length > 0 ? (
                <select 
                  className="form-control"
                  value={checkoutForm.bookId}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, bookId: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Search / Select available book --</option>
                  {availableBooks.map(b => (
                    <option key={b._id} value={b._id}>{b.title} ({b.isbn})</option>
                  ))}
                </select>
              ) : (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>No books currently available in the catalog.</p>
              )}
            </div>

            <div className="form-group">
              <label>Library Member *</label>
              {activeMembers.length > 0 ? (
                <select 
                  className="form-control"
                  value={checkoutForm.memberId}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, memberId: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Select active member --</option>
                  {activeMembers.map(m => (
                    <option key={m._id} value={m._id}>{m.name} ({m.membershipId})</option>
                  ))}
                </select>
              ) : (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>No active library members registered.</p>
              )}
            </div>

            <div className="form-group">
              <label>Due Return Date *</label>
              <input 
                type="date" 
                className="form-control"
                min={today}
                value={checkoutForm.dueDate}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, dueDate: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Defaults to 14 days standard duration.
              </span>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              disabled={availableBooks.length === 0 || activeMembers.length === 0}
            >
              Issue Book Loan
            </button>
          </form>
        </div>

        {/* Right Column: Active checkouts list */}
        <div className="glass-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <Clock size={20} color="var(--color-secondary)" />
            Active Loans ({activeLoans.length})
          </h2>

          {filteredActiveLoans.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Loan Details</th>
                    <th>Borrower</th>
                    <th>Due Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActiveLoans.map((loan) => {
                    const isOverdue = today > loan.dueDate;
                    const displayTxnId = loan.id ? loan.id.slice(-6).toUpperCase() : '';
                    return (
                      <tr key={loan.id}>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <BookOpen size={16} color="var(--text-muted)" />
                            <div>
                              <strong style={{ color: 'white', display: 'block' }}>{loan.bookTitle}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ISBN: {booksMap[loan.bookId]?.isbn || ''} • Txn: {displayTxnId}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <User size={14} color="var(--text-muted)" />
                            <span>{loan.memberName}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: isOverdue ? 'var(--color-danger)' : 'white', fontWeight: 600 }}>
                            {loan.dueDate}
                          </span>
                          {isOverdue && (
                            <span className="table-badge overdue" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                              Overdue
                            </span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-icon-only"
                            style={{ color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                            onClick={() => handleReturnClick(loan.id, loan.bookTitle)}
                            title="Check-in / Return"
                          >
                            Return Book
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
              <h3>No active loans found</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>All books are safe in the shelves!</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History Log (Bottom) */}
      <div className="glass-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
          <History size={20} color="var(--color-success)" />
          Completed Loans History ({completedLoans.length})
        </h2>

        {filteredCompletedLoans.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>Book Title</th>
                  <th>Borrower</th>
                  <th>Borrow Date</th>
                  <th>Return Date</th>
                  <th>Fines Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompletedLoans.map((loan) => {
                  const displayTxnId = loan.id ? loan.id.slice(-6).toUpperCase() : '';
                  return (
                    <tr key={loan.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{displayTxnId}</td>
                      <td>
                        <strong style={{ color: 'white' }}>{loan.bookTitle}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ISBN: {booksMap[loan.bookId]?.isbn || ''}</span>
                      </td>
                      <td>{loan.memberName}</td>
                      <td>{loan.borrowDate}</td>
                      <td>{loan.returnDate}</td>
                      <td style={{ color: loan.fineAmount > 0 ? 'var(--color-warning)' : 'var(--text-muted)' }}>
                        {loan.fineAmount > 0 ? `$${loan.fineAmount}.00` : '—'}
                      </td>
                      <td>
                        <span className="table-badge returned">Returned</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            No transaction history logged yet.
          </div>
        )}
      </div>

    </div>
  );
}

export default TransactionTracker;
