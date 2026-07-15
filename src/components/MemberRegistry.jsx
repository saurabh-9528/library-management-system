import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  Users, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Mail, 
  Phone, 
  Calendar,
  CreditCard,
  Printer
} from 'lucide-react';
import { getMembers, addMember, updateMember, deleteMember } from '../api/membersApi';
import { getTransactionHistory } from '../api/transactionsApi';

function MemberRegistry({ showNotification, initialMemberId, clearInitialMemberId }) {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Active selection
  const [currentMember, setCurrentMember] = useState(null);
  const [memberLoans, setMemberLoans] = useState({ active: [], history: [] });
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active'
  });

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getMembers();
      setMembers(data);
    } catch (e) {
      console.error(e);
      showNotification("Error loading members list.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Support global search auto-open
  useEffect(() => {
    if (initialMemberId && members.length > 0) {
      const member = members.find(m => (m._id || m.id) === initialMemberId);
      if (member) {
        openDetailModal(member);
      }
      clearInitialMemberId();
    }
  }, [initialMemberId, members]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // Filter members
  const filteredMembers = members.filter(m => {
    const cardId = m.membershipId || m._id || m.id || '';
    return (
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cardId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Action methods
  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: 'active'
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      showNotification("Please fill in all fields.", "error");
      return;
    }
    try {
      const newMember = await addMember(formData);
      showNotification(`Member "${formData.name}" registered successfully with card: ${newMember.membershipId}`);
      setShowAddModal(false);
      await loadMembers();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to register member.";
      showNotification(msg, "error");
    }
  };

  const openEditModal = (member) => {
    setCurrentMember(member);
    setFormData({
      id: member._id || member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      status: member.status
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      showNotification("Please fill in all fields.", "error");
      return;
    }
    try {
      await updateMember(formData.id, formData);
      showNotification(`Member "${formData.name}" updated successfully.`);
      setShowEditModal(false);
      await loadMembers();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update member.";
      showNotification(msg, "error");
    }
  };

  const handleDeleteClick = async (id, name) => {
    try {
      // Check if member has active checkouts
      const txns = await getTransactionHistory();
      const hasActiveLoans = txns.some(t => {
        const mId = t.memberId?._id || t.memberId;
        return mId === id && t.returnDate === null;
      });
      
      if (hasActiveLoans) {
        showNotification(`Cannot delete "${name}" while they have active book loans.`, "error");
        return;
      }

      if (window.confirm(`Are you sure you want to delete member "${name}"?`)) {
        await deleteMember(id);
        showNotification(`Member "${name}" deleted.`);
        await loadMembers();
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete member.";
      showNotification(msg, "error");
    }
  };

  const openDetailModal = async (member) => {
    setCurrentMember(member);
    setDetailSearchTerm('');
    
    try {
      // Fetch transaction logs for this member
      const txns = await getTransactionHistory();
      
      const relatedTxns = txns.filter(t => (t.memberId?._id || t.memberId) === (member._id || member.id));
      
      const active = [];
      const history = [];
      
      relatedTxns.forEach(t => {
        const loanItem = {
          id: t._id,
          bookId: t.bookId?._id || t.bookId || 'Unknown',
          bookTitle: t.bookId?.title || 'Unknown',
          bookAuthor: t.bookId?.author || 'Unknown',
          borrowDate: t.issueDate ? t.issueDate.split('T')[0] : '',
          dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
          returnDate: t.returnDate ? t.returnDate.split('T')[0] : null,
          fineAmount: t.fineAmount || 0
        };
        
        if (t.returnDate === null) {
          active.push(loanItem);
        } else {
          history.push(loanItem);
        }
      });

      setMemberLoans({ active, history });
      setShowDetailModal(true);
    } catch (e) {
      console.error(e);
      showNotification("Error loading member transaction logs.", "error");
    }
  };

  if (loading && members.length === 0) {
    return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading registry database...</div>;
  }

  return (
    <div>
      {/* Control panel */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by Name, Email, Card ID, or Phone..." 
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <UserPlus size={18} />
          <span>Register Member</span>
        </button>
      </div>

      {/* Member Table */}
      {filteredMembers.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Card ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const cardId = member.membershipId || (member._id || member.id).slice(-6).toUpperCase();
                const joinedDate = member.createdAt ? member.createdAt.split('T')[0] : member.joinedDate || '—';
                return (
                  <tr key={member._id || member.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-secondary)' }}>
                      {cardId}
                    </td>
                    <td style={{ fontWeight: 600, color: 'white' }}>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.phone}</td>
                    <td>{joinedDate}</td>
                    <td>
                      <span className={`table-badge ${member.status}`}>
                        {member.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-icon-only"
                          onClick={() => openDetailModal(member)}
                          title="Member Profile"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary btn-icon-only"
                          onClick={() => openEditModal(member)}
                          title="Edit Details"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn btn-secondary btn-icon-only"
                          onClick={() => handleDeleteClick(member._id || member.id, member.name)}
                          title="Delete Member"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No members found match the search query</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Check spelling or try a different phone/card search.</p>
        </div>
      )}

      {/* MODAL: Register Member */}
      {showAddModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddSubmit}>
            <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <UserPlus size={20} color="var(--color-success)" />
              Register New Member
            </h3>

            <div className="form-group">
              <label>Full Name *</label>
              <input 
                type="text" 
                required
                placeholder="e.g., Alice Smith" 
                className="form-control" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input 
                type="email" 
                required
                placeholder="e.g., alice@example.com" 
                className="form-control" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input 
                type="tel" 
                required
                placeholder="e.g., 555-0100" 
                className="form-control" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Register</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Edit Member */}
      {showEditModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleEditSubmit}>
            <button type="button" className="modal-close-btn" onClick={() => setShowEditModal(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <Edit size={20} color="var(--color-primary)" />
              Edit Member Details
            </h3>

            <div className="form-group">
              <label>Full Name *</label>
              <input 
                type="text" 
                required
                className="form-control" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input 
                type="email" 
                required
                className="form-control" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input 
                type="tel" 
                required
                className="form-control" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Membership Status</label>
              <select 
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Member Details Profile */}
      {showDetailModal && currentMember && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            {/* Print Header */}
            <div className="print-only-header">
              <h2>Lumina Library Member Profile</h2>
              <p>Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            </div>

            <button type="button" className="modal-close-btn" onClick={() => setShowDetailModal(false)}>
              <X size={20} />
            </button>
            <h3 className="modal-title">
              <CreditCard size={20} color="var(--color-secondary)" />
              Library Card Profile
            </h3>

            <div className="detail-modal-layout">
              {/* Virtual Library Card */}
              <div className="member-id-card">
                <div className="card-header-logo">
                  <CreditCard size={14} color="var(--color-secondary)" />
                  <span>LUMINA LIBRARY SYSTEM</span>
                </div>
                
                <div className="card-body-details">
                  <div className="card-member-name">{currentMember.name}</div>
                  <div className="card-member-id">{currentMember.membershipId || (currentMember._id || currentMember.id).slice(-6).toUpperCase()}</div>
                </div>

                <div className="card-footer-info">
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem' }}>MEMBER SINCE</span>
                    <strong style={{ color: 'white' }}>{currentMember.createdAt ? currentMember.createdAt.split('T')[0] : currentMember.joinedDate || '—'}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem' }}>STATUS</span>
                    <strong style={{ color: currentMember.status === 'active' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {currentMember.status.toUpperCase()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Contact Detail Section */}
              <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
                    <Mail size={14} color="var(--text-muted)" />
                    <span>{currentMember.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}>
                    <Phone size={14} color="var(--text-muted)" />
                    <span>{currentMember.phone}</span>
                  </div>
                </div>
              </div>

              {/* Mini Logs Search Bar */}
              <div className="search-input-wrapper" style={{ margin: '0' }}>
                <Search size={14} className="search-icon" style={{ left: '0.75rem' }} />
                <input 
                  type="text" 
                  placeholder="Filter active loans & history logs..." 
                  value={detailSearchTerm}
                  onChange={(e) => setDetailSearchTerm(e.target.value)}
                  style={{ padding: '0.4rem 1rem 0.4rem 2rem', fontSize: '0.85rem', borderRadius: '8px' }}
                />
              </div>

              {/* Current Active Loans */}
              <div>
                <h4 className="detail-section-title">Active Loans ({memberLoans.active.filter(l => l.bookTitle.toLowerCase().includes(detailSearchTerm.toLowerCase()) || l.bookId.toLowerCase().includes(detailSearchTerm.toLowerCase())).length})</h4>
                <div className="detail-history-list" style={{ maxHeight: '120px' }}>
                  {memberLoans.active.filter(l => l.bookTitle.toLowerCase().includes(detailSearchTerm.toLowerCase()) || l.bookId.toLowerCase().includes(detailSearchTerm.toLowerCase())).length > 0 ? (
                    memberLoans.active.filter(l => l.bookTitle.toLowerCase().includes(detailSearchTerm.toLowerCase()) || l.bookId.toLowerCase().includes(detailSearchTerm.toLowerCase())).map(txn => {
                      const isOverdue = new Date() > new Date(txn.dueDate);
                      return (
                        <div key={txn.id} className="detail-history-item" style={isOverdue ? {borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239,68,68,0.02)'} : {}}>
                          <div className="detail-history-main">
                            <span className="detail-history-title">{txn.bookTitle}</span>
                            <span className="detail-history-sub">Due: {txn.dueDate}</span>
                          </div>
                          {isOverdue && (
                            <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', fontWeight: 600 }}>
                              Overdue
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                      No active loans matched.
                    </p>
                  )}
                </div>
              </div>

              {/* Borrowing History */}
              <div>
                <h4 className="detail-section-title">History Logs ({memberLoans.history.filter(l => l.bookTitle.toLowerCase().includes(detailSearchTerm.toLowerCase()) || l.bookId.toLowerCase().includes(detailSearchTerm.toLowerCase())).length})</h4>
                <div className="detail-history-list" style={{ maxHeight: '120px' }}>
                  {memberLoans.history.filter(l => l.bookTitle.toLowerCase().includes(detailSearchTerm.toLowerCase()) || l.bookId.toLowerCase().includes(detailSearchTerm.toLowerCase())).length > 0 ? (
                    memberLoans.history.filter(l => l.bookTitle.toLowerCase().includes(detailSearchTerm.toLowerCase()) || l.bookId.toLowerCase().includes(detailSearchTerm.toLowerCase())).map(txn => (
                      <div key={txn.id} className="detail-history-item">
                        <div className="detail-history-main">
                          <span className="detail-history-title">{txn.bookTitle}</span>
                          <span className="detail-history-sub">Returned: {txn.returnDate}</span>
                        </div>
                        {txn.fineAmount > 0 && (
                          <span style={{ color: 'var(--color-warning)', fontSize: '0.8rem', fontWeight: 600 }}>
                            Fine: ${txn.fineAmount}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                      No completed loans matched.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => window.print()} title="Print member report sheet">
                <Printer size={14} />
                <span>Print Profile</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberRegistry;
