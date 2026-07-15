const INITIAL_BOOKS = [
  { id: "BK-1001", title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", category: "Fiction", publishedYear: 1925, status: "available" },
  { id: "BK-1002", title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084", category: "Fiction", publishedYear: 1960, status: "borrowed" },
  { id: "BK-1003", title: "A Brief History of Time", author: "Stephen Hawking", isbn: "9780553380163", category: "Science", publishedYear: 1988, status: "available" },
  { id: "BK-1004", title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", category: "Technology", publishedYear: 2008, status: "borrowed" },
  { id: "BK-1005", title: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316097", category: "History", publishedYear: 2011, status: "available" },
  { id: "BK-1006", title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "9780547928227", category: "Fantasy", publishedYear: 1937, status: "available" },
  { id: "BK-1007", title: "Atomic Habits", author: "James Clear", isbn: "9780735211292", category: "Self-Help", publishedYear: 2018, status: "available" },
  { id: "BK-1008", title: "Design Patterns", author: "Erich Gamma", isbn: "9780201633610", category: "Technology", publishedYear: 1994, status: "borrowed" },
  { id: "BK-1009", title: "Educated", author: "Tara Westover", isbn: "9780399590504", category: "Biography", publishedYear: 2018, status: "available" },
  { id: "BK-1010", title: "The Silent Patient", author: "Alex Michaelides", isbn: "9781250301697", category: "Mystery", publishedYear: 2019, status: "available" },
  { id: "BK-1011", title: "Dune", author: "Frank Herbert", isbn: "9780441172719", category: "Sci-Fi", publishedYear: 1965, status: "available" },
  { id: "BK-1012", title: "Steve Jobs", author: "Walter Isaacson", isbn: "9781451648539", category: "Biography", publishedYear: 2011, status: "borrowed" }
];

const INITIAL_MEMBERS = [
  { id: "MEM-101", name: "Sarah Connor", email: "sarah.c@sky.net", phone: "555-0199", joinedDate: "2026-01-15", status: "active" },
  { id: "MEM-102", name: "John Doe", email: "john.doe@gmail.com", phone: "555-0142", joinedDate: "2026-02-20", status: "active" },
  { id: "MEM-103", name: "Alice Smith", email: "alice.s@outlook.com", phone: "555-0173", joinedDate: "2026-03-05", status: "active" },
  { id: "MEM-104", name: "Bob Johnson", email: "bob.j@yahoo.com", phone: "555-0128", joinedDate: "2026-04-12", status: "active" },
  { id: "MEM-105", name: "Clara Oswald", email: "clara.o@tardis.co", phone: "555-0185", joinedDate: "2026-05-18", status: "active" },
  { id: "MEM-106", name: "David Miller", email: "david.m@gmail.com", phone: "555-0111", joinedDate: "2026-06-01", status: "active" }
];

const INITIAL_TRANSACTIONS = [
  // Active checkouts
  { id: "TXN-2001", bookId: "BK-1002", memberId: "MEM-102", borrowDate: "2026-06-15", dueDate: "2026-06-29", returnDate: null, fineAmount: 0 },
  { id: "TXN-2002", bookId: "BK-1004", memberId: "MEM-101", borrowDate: "2026-06-18", dueDate: "2026-07-02", returnDate: null, fineAmount: 0 },
  { id: "TXN-2003", bookId: "BK-1008", memberId: "MEM-104", borrowDate: "2026-06-10", dueDate: "2026-06-24", returnDate: null, fineAmount: 0 }, // Overdue!
  { id: "TXN-2004", bookId: "BK-1012", memberId: "MEM-105", borrowDate: "2026-06-22", dueDate: "2026-07-06", returnDate: null, fineAmount: 0 },
  
  // Past returned loans
  { id: "TXN-2005", bookId: "BK-1001", memberId: "MEM-102", borrowDate: "2026-06-01", dueDate: "2026-06-15", returnDate: "2026-06-12", fineAmount: 0 },
  { id: "TXN-2006", bookId: "BK-1003", memberId: "MEM-103", borrowDate: "2026-05-28", dueDate: "2026-06-11", returnDate: "2026-06-10", fineAmount: 0 },
  { id: "TXN-2007", bookId: "BK-1005", memberId: "MEM-101", borrowDate: "2026-06-05", dueDate: "2026-06-19", returnDate: "2026-06-15", fineAmount: 0 },
  { id: "TXN-2008", bookId: "BK-1011", memberId: "MEM-105", borrowDate: "2026-05-15", dueDate: "2026-05-29", returnDate: "2026-05-29", fineAmount: 0 },
  { id: "TXN-2009", bookId: "BK-1006", memberId: "MEM-106", borrowDate: "2026-06-08", dueDate: "2026-06-22", returnDate: "2026-06-20", fineAmount: 0 }
];

const INITIAL_RESERVATIONS = [
  { id: "RES-3001", bookId: "BK-1002", memberId: "MEM-101", reserveDate: "2026-06-20", status: "active" },
  { id: "RES-3002", bookId: "BK-1006", memberId: "MEM-103", reserveDate: "2026-06-22", status: "active" }
];

const STORAGE_KEYS = {
  BOOKS: "lib_system_books",
  MEMBERS: "lib_system_members",
  TRANSACTIONS: "lib_system_txns",
  RESERVATIONS: "lib_system_reservations"
};

// Local storage helpers
const loadData = (key, initial) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
};

const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Public Database APIs
export const db = {
  getBooks: () => loadData(STORAGE_KEYS.BOOKS, INITIAL_BOOKS),
  saveBooks: (books) => saveData(STORAGE_KEYS.BOOKS, books),
  
  getMembers: () => loadData(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS),
  saveMembers: (members) => saveData(STORAGE_KEYS.MEMBERS, members),
  
  getTransactions: () => loadData(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS),
  saveTransactions: (txns) => saveData(STORAGE_KEYS.TRANSACTIONS, txns),

  getReservations: () => loadData(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS),
  saveReservations: (reservations) => saveData(STORAGE_KEYS.RESERVATIONS, reservations),

  // Books CRUD
  addBook: (book) => {
    const books = db.getBooks();
    const newBook = {
      ...book,
      id: book.id || `BK-${Date.now().toString().slice(-4)}`,
      status: "available"
    };
    books.push(newBook);
    db.saveBooks(books);
    return newBook;
  },

  updateBook: (updatedBook) => {
    const books = db.getBooks();
    const idx = books.findIndex(b => b.id === updatedBook.id);
    if (idx !== -1) {
      books[idx] = { ...books[idx], ...updatedBook };
      db.saveBooks(books);
    }
  },

  deleteBook: (id) => {
    const books = db.getBooks();
    const filtered = books.filter(b => b.id !== id);
    db.saveBooks(filtered);
  },

  // Members CRUD
  addMember: (member) => {
    const members = db.getMembers();
    const newMember = {
      ...member,
      id: member.id || `MEM-${Date.now().toString().slice(-3)}`,
      joinedDate: new Date().toISOString().split("T")[0],
      status: "active"
    };
    members.push(newMember);
    db.saveMembers(members);
    return newMember;
  },

  updateMember: (updatedMember) => {
    const members = db.getMembers();
    const idx = members.findIndex(m => m.id === updatedMember.id);
    if (idx !== -1) {
      members[idx] = { ...members[idx], ...updatedMember };
      db.saveMembers(members);
    }
  },

  deleteMember: (id) => {
    const members = db.getMembers();
    const filtered = members.filter(m => m.id !== id);
    db.saveMembers(filtered);
  },

  // Borrow & Return operations
  borrowBook: (bookId, memberId, dueDate) => {
    const books = db.getBooks();
    const txns = db.getTransactions();
    const resList = db.getReservations();
    
    // Find and update book status
    const bookIdx = books.findIndex(b => b.id === bookId);
    if (bookIdx === -1 || (books[bookIdx].status !== "available" && books[bookIdx].status !== "reserved")) {
      throw new Error("Book is not available for borrowing.");
    }

    // Check if there is an active reservation for this book by this member, and mark it completed
    const resIdx = resList.findIndex(r => r.bookId === bookId && r.memberId === memberId && r.status === "active");
    if (resIdx !== -1) {
      resList[resIdx].status = "completed";
      db.saveReservations(resList);
    } else {
      // If there's an active reservation for this book by SOMEONE ELSE, we should block checkouts!
      const otherActiveRes = resList.find(r => r.bookId === bookId && r.status === "active");
      if (otherActiveRes) {
        throw new Error(`This book is reserved by another member (${otherActiveRes.memberId}).`);
      }
    }

    books[bookIdx].status = "borrowed";
    
    // Add transaction
    const newTxn = {
      id: `TXN-${Date.now().toString().slice(-4)}`,
      bookId,
      memberId,
      borrowDate: new Date().toISOString().split("T")[0],
      dueDate,
      returnDate: null,
      fineAmount: 0
    };
    
    txns.unshift(newTxn); // Latest at the top
    
    db.saveBooks(books);
    db.saveTransactions(txns);
    return newTxn;
  },

  returnBook: (txnId) => {
    const txns = db.getTransactions();
    const books = db.getBooks();
    const resList = db.getReservations();
    
    const txnIdx = txns.findIndex(t => t.id === txnId);
    if (txnIdx === -1 || txns[txnIdx].returnDate !== null) {
      throw new Error("Transaction not found or book already returned.");
    }
    
    const txn = txns[txnIdx];
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Calculate fine (e.g. $1 per day overdue)
    const dueDate = new Date(txn.dueDate);
    const today = new Date(todayStr);
    let fine = 0;
    if (today > dueDate) {
      const diffTime = Math.abs(today - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = diffDays * 1; // $1 per day
    }
    
    // Update transaction
    txn.returnDate = todayStr;
    txn.fineAmount = fine;
    
    // Update book status
    const bookIdx = books.findIndex(b => b.id === txn.bookId);
    if (bookIdx !== -1) {
      const hasActiveRes = resList.some(r => r.bookId === txn.bookId && r.status === "active");
      if (hasActiveRes) {
        books[bookIdx].status = "reserved";
      } else {
        books[bookIdx].status = "available";
      }
    }
    
    db.saveBooks(books);
    db.saveTransactions(txns);
    return txn;
  },

  // Analytics Helpers
  getStats: () => {
    const books = db.getBooks();
    const members = db.getMembers();
    const txns = db.getTransactions();
    const today = new Date();
    
    const totalBooks = books.length;
    const activeLoans = txns.filter(t => t.returnDate === null).length;
    
    const overdueLoansList = txns.filter(t => {
      if (t.returnDate !== null) return false;
      const dueDate = new Date(t.dueDate);
      return today > dueDate;
    });
    const overdueLoans = overdueLoansList.length;
    const totalMembers = members.length;

    // Borrowing trend by category
    const categoryCount = {};
    books.forEach(b => {
      categoryCount[b.category] = (categoryCount[b.category] || 0) + 1;
    });
    const categoryData = Object.keys(categoryCount).map(cat => ({
      name: cat,
      value: categoryCount[cat]
    }));

    // Borrowing trends over the last few days (weekly Activity mock)
    // We group by transaction borrowDate
    const dateCounts = {};
    txns.forEach(t => {
      const date = t.borrowDate;
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    // Sort dates
    const trendData = Object.keys(dateCounts)
      .sort()
      .slice(-7) // Last 7 unique dates
      .map(date => {
        // Format date to show Month Day (e.g. Jun 15)
        const d = new Date(date);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        return {
          date: label,
          borrows: dateCounts[date]
        };
      });

    return {
      totalBooks,
      activeLoans,
      overdueLoans,
      totalMembers,
      categoryData,
      trendData,
      overdueLoansList
    };
  },

  // Reservations CRUD
  reserveBook: (bookId, memberId) => {
    const books = db.getBooks();
    const resList = db.getReservations();

    const bookIdx = books.findIndex(b => b.id === bookId);
    if (bookIdx === -1) {
      throw new Error("Book not found.");
    }
    
    // Check if member already has an active reservation for this book
    const existing = resList.find(r => r.bookId === bookId && r.memberId === memberId && r.status === "active");
    if (existing) {
      throw new Error("Member already has an active reservation for this book.");
    }

    const book = books[bookIdx];
    
    // If book is available, reservation immediately sets its status to "reserved"
    if (book.status === "available") {
      book.status = "reserved";
      db.saveBooks(books);
    }

    const newRes = {
      id: `RES-${Date.now().toString().slice(-4)}`,
      bookId,
      memberId,
      reserveDate: new Date().toISOString().split("T")[0],
      status: "active"
    };

    resList.unshift(newRes);
    db.saveReservations(resList);
    return newRes;
  },

  cancelReservation: (resId) => {
    const resList = db.getReservations();
    const books = db.getBooks();
    
    const idx = resList.findIndex(r => r.id === resId);
    if (idx === -1) {
      throw new Error("Reservation not found.");
    }

    const res = resList[idx];
    res.status = "cancelled";

    // If the book is currently marked as "reserved", verify if there are other active reservations for it.
    // If none, it becomes "available" again.
    const bookIdx = books.findIndex(b => b.id === res.bookId);
    if (bookIdx !== -1 && books[bookIdx].status === "reserved") {
      const otherActive = resList.some(r => r.id !== resId && r.bookId === res.bookId && r.status === "active");
      if (!otherActive) {
        books[bookIdx].status = "available";
        db.saveBooks(books);
      }
    }

    db.saveReservations(resList);
    return res;
  }
};
