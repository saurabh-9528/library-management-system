import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  Check, 
  Calendar, 
  AlertTriangle, 
  PlusCircle, 
  X, 
  Printer 
} from 'lucide-react';
import { getBooks } from '../api/booksApi';
import { getMembers } from '../api/membersApi';
import { borrowBook } from '../api/transactionsApi';
import { getReservations, reserveBook, cancelReservation } from '../api/reservationsApi';

function BookReservations({ showNotification }) {
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Available selections for the form
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  
  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [resForm, setResForm] = useState({ bookId: '', memberId: '' });

  // Loan fulfillment modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [activeResToFulfill, setActiveResToFulfill] = useState(null);
  
  const getDefaultDueDate = () => {
    const twoWeeks = Date.now() + 14 * 24 * 60 * 60 * 1000;
    return new Date(twoWeeks).toISOString().split('T')[0];
  };
  const [dueDate, setDueDate] = useState(getDefaultDueDate());

  const loadData = async () => {
    try {
      setLoading(true);
      const [resList, allBooks, allMembers] = await Promise.all([
        getReservations(),
        getBooks(),
        getMembers()
      ]);

      // Maps for quick lookups
      const booksMap = {};
      allBooks.forEach(b => { booksMap[b._id || b.id] = b; });
      
      const membersMap = {};
      allMembers.forEach(m => { membersMap[m._id || m.id] = m; });

      // Build hydrated list
      const hydrated = resList.map(r => {
        const bookObj = r.bookId?._id ? r.bookId : booksMap[r.bookId];
        const memberObj = r.memberId?._id ? r.memberId : membersMap[r.memberId];
        return {
          id: r._id,
          bookId: bookObj?._id || r.bookId,
          bookTitle: bookObj?.title || 'Unknown',
          bookCategory: bookObj?.category || 'Fiction',
          bookStatus: bookObj?.status || 'unknown',
          memberId: memberObj?._id || r.memberId,
          memberName: memberObj?.name || 'Unknown',
          memberEmail: memberObj?.email || '',
          status: r.status,
          reserveDate: r.reservationDate ? r.reservationDate.split('T')[0] : ''
        };
      });

      setReservations(hydrated);
      setBooks(allBooks);
      setMembers(allMembers.filter(m => m.status === 'active'));
    } catch (e) {
      console.error("Error loading reservation details:", e);
      showNotification("Could not load reservations queue.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    if (!resForm.bookId || !resForm.memberId) {
      showNotification("Please select a book and member.", "error");
      return;
    }

    try {
      await reserveBook(resForm.bookId, resForm.memberId);
      
      const bookTitle = books.find(b => (b._id || b.id) === resForm.bookId)?.title || resForm.bookId;
      const memberName = members.find(m => (m._id || m.id) === resForm.memberId)?.name || resForm.memberId;
      
      showNotification(`Reservation placed for "${bookTitle}" for ${memberName}.`);
      setShowAddModal(false);
      setResForm({ bookId: '', memberId: '' });
      await loadData();
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      showNotification(msg, "error");
    }
  };

  const handleCancelReservation = async (resId, bookTitle) => {
    if (window.confirm(`Are you sure you want to cancel the reservation for "${bookTitle}"?`)) {
      try {
        await cancelReservation(resId);
        showNotification("Reservation cancelled.");
        await loadData();
      } catch (error) {
        const msg = error.response?.data?.message || error.message;
        showNotification(msg, "error");
      }
    }
  };

  const openIssueModal = (res) => {
    setActiveResToFulfill(res);
    setDueDate(getDefaultDueDate());
    setShowIssueModal(true);
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    if (!activeResToFulfill) return;

    try {
      // borrowBook automatically marks matching active reservations as completed!
      await borrowBook(activeResToFulfill.bookId, activeResToFulfill.memberId, dueDate);
      showNotification(`Issued "${activeResToFulfill.bookTitle}" to ${activeResToFulfill.memberName}.`);
      setShowIssueModal(false);
      setActiveResToFulfill(null);
      await loadData();
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      showNotification(msg, "error");
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  // Filtered list
  const filteredReservations = reservations.filter(r => 
    r.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.memberId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeResCount = filteredReservations.filter(r => r.status === 'active').length;

  if (loading && reservations.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading reservations log...</div>;
  }

  return (
    <div>
      {/* Print Only Header */}
      <div className="print-only-header">
        <h2>Lumina Library System</h2>
        <p>Book Reservations Report — Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p>Total Active Queues: {activeResCount}</p>
      </div>

      {/* Control panel */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search reservations by Book, Member name, Card ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-actions">
          <button className="btn btn-secondary" onClick={triggerPrint}>
            <Printer size={18} />
            <span>Print Report</span>
          </button>
          
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <PlusCircle size={18} />
            <span>Place Reservation</span>
          </button>
        </div>
      </div>

      {/* Grid of reservation cards */}
      {filteredReservations.length > 0 ? (
        <div className="res-card-grid">
          {filteredReservations.map((res) => {
            const isActive = res.status === 'active';
            const isBookAvailable = res.bookStatus === 'available' || res.bookStatus === 'reserved';
            const displayResId = res.id ? res.id.slice(-6).toUpperCase() : '';
            const displayMemberCard = res.memberEmail ? res.memberEmail.split('@')[0] : res.memberId.slice(-6).toUpperCase();
            
            return (
              <div key={res.id} className={`glass-card res-card ${res.status}`}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className={`res-badge ${res.status}`}>
                      {res.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {displayResId}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.25rem 0' }}>{res.bookTitle}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Category: <span className={`book-category-badge category-${res.bookCategory}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem', margin: 0 }}>{res.bookCategory}</span>
                  </p>

                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.015)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Reserved For:</div>
                    <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: 700 }}>{res.memberName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Card ID: {displayMemberCard}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Calendar size={14} />
                    <span>Reserved on: {res.reserveDate}</span>
                  </div>
                </div>

                {isActive && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleCancelReservation(res.id, res.bookTitle)}
                      style={{ flex: 1, justifyContent: 'center', color: 'var(--color-danger)', padding: '0.5rem' }}
                    >
                      <Trash2 size={14} />
                      <span>Cancel</span>
                    </button>
                    
                    <button 
                      className="btn btn-primary" 
                      onClick={() => openIssueModal(res)}
                      style={{ flex: 1.5, justifyContent: 'center', padding: '0.5rem' }}
                      disabled={!isBookAvailable}
                      title={!isBookAvailable ? "Book is currently borrowed by someone else." : "Issue to member"}
                    >
                      <Check size={14} />
                      <span>{isBookAvailable ? 'Fulfill & Issue' : 'Awaiting Return'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Bookmark size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No reservations match the filter criteria</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Create a new book queue for members.</p>
        </div>
      )}

      {/* MODAL: Place Reservation */}
      {showAddModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleCreateReservation}>
            <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <Bookmark size={20} color="var(--color-secondary)" />
              Place Book Reservation
            </h3>

            <div className="form-group">
              <label>Select Book</label>
              <select 
                className="form-control"
                value={resForm.bookId}
                onChange={(e) => setResForm({ ...resForm, bookId: e.target.value })}
                style={{ width: '100%' }}
                required
              >
                <option value="">-- Select a catalog book --</option>
                {books.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.title} ({b.isbn}) [{b.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Reserving Member</label>
              <select 
                className="form-control"
                value={resForm.memberId}
                onChange={(e) => setResForm({ ...resForm, memberId: e.target.value })}
                style={{ width: '100%' }}
                required
              >
                <option value="">-- Choose active member card --</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.membershipId})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Queue</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Fulfill Reservation (Issue Loan) */}
      {showIssueModal && activeResToFulfill && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleFulfillSubmit}>
            <button type="button" className="modal-close-btn" onClick={() => { setShowIssueModal(false); setActiveResToFulfill(null); }}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <Check size={20} color="var(--color-success)" />
              Fulfill Reservation Queue
            </h3>

            <div style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              <p>You are checking out <strong>{activeResToFulfill.bookTitle}</strong> to <strong>{activeResToFulfill.memberName}</strong>.</p>
            </div>

            <div className="form-group">
              <label>Select Loan Due Date</label>
              <input 
                type="date" 
                className="form-control"
                value={dueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowIssueModal(false); setActiveResToFulfill(null); }}>Cancel</button>
              <button type="submit" className="btn btn-primary">Fulfill & Checkout</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default BookReservations;
