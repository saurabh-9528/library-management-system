import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Layers,
  Bookmark,
  Printer
} from 'lucide-react';
import { getBooks, addBook, updateBook, deleteBook } from '../api/booksApi';
import { getMembers } from '../api/membersApi';
import { reserveBook, getReservations } from '../api/reservationsApi';
import { getTransactionHistory } from '../api/transactionsApi';

function BookCatalog({ showNotification, initialBookId, clearInitialBookId }) {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  
  // Active selected entities
  const [currentBook, setCurrentBook] = useState(null);
  const [bookHistory, setBookHistory] = useState([]);
  const [currentBookReservation, setCurrentBookReservation] = useState(null);
  
  // Reservation states
  const [reserveBookTarget, setReserveBookTarget] = useState(null);
  const [reserveMemberId, setReserveMemberId] = useState('');
  const [activeMembers, setActiveMembers] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Fiction',
    publishedYear: 2026,
    quantity: 1
  });

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await getBooks();
      setBooks(data);
    } catch (e) {
      console.error(e);
      showNotification("Error loading books catalog.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // Support global search auto-open
  useEffect(() => {
    if (initialBookId && books.length > 0) {
      const book = books.find(b => (b._id || b.id) === initialBookId);
      if (book) {
        openDetailModal(book);
      }
      clearInitialBookId();
    }
  }, [initialBookId, books]);

  const openReserveModal = async (book) => {
    setReserveBookTarget(book);
    setReserveMemberId('');
    try {
      const membersList = await getMembers();
      setActiveMembers(membersList.filter(m => m.status === 'active'));
      setShowReserveModal(true);
    } catch (error) {
      showNotification("Error loading members list.", "error");
    }
  };

  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    if (!reserveMemberId || !reserveBookTarget) return;
    try {
      await reserveBook(reserveBookTarget._id || reserveBookTarget.id, reserveMemberId);
      showNotification(`Successfully reserved "${reserveBookTarget.title}".`);
      setShowReserveModal(false);
      setReserveBookTarget(null);
      await loadBooks();
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      showNotification(msg, "error");
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleCategoryChange = (e) => setCategoryFilter(e.target.value);

  // Filtered books
  const filteredBooks = books.filter(b => {
    const bookIdStr = b._id || b.id || '';
    const matchSearch = 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookIdStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === '' || b.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // Action methods
  const openAddModal = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: 'Fiction',
      publishedYear: new Date().getFullYear(),
      quantity: 1
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.isbn) {
      showNotification("Please fill in all required fields.", "error");
      return;
    }
    try {
      await addBook(formData);
      showNotification(`"${formData.title}" added to catalog.`);
      setShowAddModal(false);
      await loadBooks();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to add book.";
      showNotification(msg, "error");
    }
  };

  const openEditModal = (book) => {
    setCurrentBook(book);
    setFormData({
      id: book._id || book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      publishedYear: book.publishedYear || new Date().getFullYear(),
      quantity: book.quantity || 1
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.isbn) {
      showNotification("Please fill in all required fields.", "error");
      return;
    }
    try {
      await updateBook(formData.id, formData);
      showNotification(`"${formData.title}" updated successfully.`);
      setShowEditModal(false);
      await loadBooks();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update book.";
      showNotification(msg, "error");
    }
  };

  const handleDeleteClick = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}" from the catalog?`)) {
      try {
        await deleteBook(id);
        showNotification(`"${title}" deleted successfully.`);
        await loadBooks();
      } catch (error) {
        const msg = error.response?.data?.message || "Failed to delete book.";
        showNotification(msg, "error");
      }
    }
  };

  const openDetailModal = async (book) => {
    setCurrentBook(book);
    
    try {
      // Fetch borrowing history for this book
      const [txns, resList] = await Promise.all([
        getTransactionHistory(),
        getReservations()
      ]);
      
      const history = txns
         .filter(t => (t.bookId?._id || t.bookId) === (book._id || book.id))
         .map(t => ({
           id: t._id,
           memberName: t.memberId?.name || 'Unknown',
           memberId: t.memberId?.membershipId || 'Unknown',
           borrowDate: t.issueDate ? t.issueDate.split('T')[0] : '',
           returnDate: t.returnDate ? t.returnDate.split('T')[0] : null,
           fineAmount: t.fineAmount || 0
         }));
         
       setBookHistory(history);

       // Check active reservation
       const activeRes = resList.find(r => (r.bookId?._id || r.bookId) === (book._id || book.id) && r.status === 'active');
       if (activeRes) {
         setCurrentBookReservation({
           id: activeRes._id,
           memberName: activeRes.memberId?.name || 'Unknown',
           memberId: activeRes.memberId?.membershipId || 'Unknown',
           reserveDate: activeRes.reservationDate ? activeRes.reservationDate.split('T')[0] : ''
         });
       } else {
         setCurrentBookReservation(null);
       }

       setShowDetailModal(true);
    } catch (e) {
      console.error(e);
      showNotification("Error loading book history profile details.", "error");
    }
  };

  if (loading && books.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading catalog database...</div>;
  }

  return (
    <div>
      {/* Control / Filter Bar */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by Title, Author, ISBN, or Book ID..." 
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filter-actions">
          <select value={categoryFilter} onChange={handleCategoryChange}>
            <option value="">All Categories</option>
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

          <button className="btn btn-secondary" onClick={() => window.print()} title="Print catalog report">
            <Printer size={18} />
            <span>Print Report</span>
          </button>

          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Book Grid */}
      {filteredBooks.length > 0 ? (
        <div className="books-grid">
          {filteredBooks.map((book) => {
            const bookId = book._id || book.id;
            return (
              <div key={bookId} className="glass-card book-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className={`book-category-badge category-${book.category}`}>
                      {book.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {bookId.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="book-title" title={book.title}>{book.title}</h3>
                  <p className="book-author">by {book.author}</p>
                </div>

                <div>
                  <div className="book-meta-footer">
                    <div className={`book-status ${book.status === 'available' ? 'status-available' : book.status === 'reserved' ? 'status-reserved' : 'status-borrowed'}`}>
                      <span className="status-indicator"></span>
                      <span style={{ textTransform: 'capitalize' }}>{book.status}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        onClick={() => openDetailModal(book)} 
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        onClick={() => openReserveModal(book)} 
                        title="Reserve Book"
                        disabled={book.status === 'reserved'}
                        style={book.status === 'reserved' ? {opacity: 0.5} : {}}
                      >
                        <Bookmark size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        onClick={() => openEditModal(book)} 
                        title="Edit Book"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        onClick={() => handleDeleteClick(bookId, book.title)} 
                        title="Delete Book"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No books found match the criteria</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Try refining your search queries or category filters.</p>
        </div>
      )}

      {/* MODAL: Add Book */}
      {showAddModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddSubmit}>
            <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <BookOpen size={20} color="var(--color-primary)" />
              Add New Catalog Entry
            </h3>

            <div className="form-group">
              <label>Book Title *</label>
              <input 
                type="text" 
                required
                placeholder="e.g., Dune" 
                className="form-control" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Author Name *</label>
              <input 
                type="text" 
                required
                placeholder="e.g., Frank Herbert" 
                className="form-control" 
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ISBN Number *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., 9780441172719" 
                  className="form-control" 
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-control" 
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Category / Genre</label>
              <select 
                className="form-control" 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Book</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Edit Book */}
      {showEditModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleEditSubmit}>
            <button type="button" className="modal-close-btn" onClick={() => setShowEditModal(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <Edit size={20} color="var(--color-primary)" />
              Edit Book Information
            </h3>

            <div className="form-group">
              <label>Book Title *</label>
              <input 
                type="text" 
                required
                className="form-control" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Author Name *</label>
              <input 
                type="text" 
                required
                className="form-control" 
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ISBN Number *</label>
                <input 
                  type="text" 
                  required
                  className="form-control" 
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-control" 
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Category / Genre</label>
              <select 
                className="form-control" 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Book Details (History & Info) */}
      {showDetailModal && currentBook && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <button type="button" className="modal-close-btn" onClick={() => setShowDetailModal(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <BookOpen size={20} color="var(--color-secondary)" />
              Book Details
            </h3>

            <div className="detail-modal-layout">
              {/* Metadata Info */}
              <div>
                <h4 className="detail-section-title">Catalog Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Book ID</label>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{(currentBook._id || currentBook.id)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <span style={{ 
                      color: currentBook.status === 'available' ? 'var(--color-success)' : 
                             currentBook.status === 'reserved' ? 'var(--color-secondary)' : 
                             'var(--color-warning)',
                      textTransform: 'capitalize'
                    }}>
                      {currentBook.status}
                    </span>
                  </div>
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <label>Title</label>
                    <span style={{ fontSize: '1.1rem', color: 'white' }}>{currentBook.title}</span>
                  </div>
                  {currentBookReservation && (
                    <div className="detail-item" style={{ gridColumn: 'span 2', background: 'rgba(6, 182, 212, 0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                      <label style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>Active Reservation Queue</label>
                      <span style={{ fontSize: '0.85rem' }}>Reserved by: {currentBookReservation.memberName} ({currentBookReservation.memberId}) on {currentBookReservation.reserveDate}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>Author</label>
                    <span>{currentBook.author}</span>
                  </div>
                  <div className="detail-item">
                    <label>Category</label>
                    <span>{currentBook.category}</span>
                  </div>
                  <div className="detail-item">
                    <label>ISBN</label>
                    <span>{currentBook.isbn}</span>
                  </div>
                  <div className="detail-item">
                    <label>Available Copies</label>
                    <span>{currentBook.availableCopies} / {currentBook.quantity}</span>
                  </div>
                </div>
              </div>

              {/* Borrowing History */}
              <div>
                <h4 className="detail-section-title">Borrowing Logs</h4>
                <div className="detail-history-list">
                  {bookHistory.length > 0 ? (
                    bookHistory.map(txn => (
                      <div key={txn.id} className="detail-history-item">
                        <div className="detail-history-main">
                          <span className="detail-history-title">{txn.memberName}</span>
                          <span className="detail-history-sub">Card: {txn.memberId}</span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                          <div style={{ color: 'white', fontWeight: 600 }}>
                            {txn.borrowDate} to {txn.returnDate || 'Present'}
                          </div>
                          <div style={{ color: txn.returnDate ? 'var(--text-muted)' : 'var(--color-warning)' }}>
                            {txn.returnDate ? 'Returned' : 'Active Loan'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                      No loan history found for this book.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close View</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Place Book Reservation */}
      {showReserveModal && reserveBookTarget && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleReserveSubmit}>
            <button type="button" className="modal-close-btn" onClick={() => { setShowReserveModal(false); setReserveBookTarget(null); }}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <Bookmark size={20} color="var(--color-secondary)" />
              Place Book Reservation
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Book Selected</label>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'white' }}>{reserveBookTarget.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Author: {reserveBookTarget.author}</div>
            </div>

            <div className="form-group">
              <label>Select Reserving Member</label>
              {activeMembers.length > 0 ? (
                <select 
                  className="form-control" 
                  value={reserveMemberId}
                  onChange={(e) => setReserveMemberId(e.target.value)}
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- Choose active member card --</option>
                  {activeMembers.map(m => (
                    <option key={m._id} value={m._id}>{m.name} ({m.membershipId})</option>
                  ))}
                </select>
              ) : (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>No active library members registered.</p>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowReserveModal(false); setReserveBookTarget(null); }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={activeMembers.length === 0}>Create Reservation</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default BookCatalog;
