const connectDB = require('./config/database');
const { Book, Member, Transaction, Reservation, User } = require('./models');
const mongoose = require('mongoose');

const INITIAL_BOOKS = [
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", category: "Fiction", quantity: 5, availableCopies: 5, status: "available" },
  { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084", category: "Fiction", quantity: 3, availableCopies: 2, status: "available" },
  { title: "A Brief History of Time", author: "Stephen Hawking", isbn: "9780553380163", category: "Science", quantity: 2, availableCopies: 2, status: "available" },
  { title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", category: "Technology", quantity: 4, availableCopies: 3, status: "available" },
  { title: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316097", category: "History", quantity: 3, availableCopies: 3, status: "available" },
  { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "9780547928227", category: "Fantasy", quantity: 5, availableCopies: 5, status: "available" },
  { title: "Atomic Habits", author: "James Clear", isbn: "9780735211292", category: "Self-Help", quantity: 4, availableCopies: 4, status: "available" },
  { title: "Design Patterns", author: "Erich Gamma", isbn: "9780201633610", category: "Technology", quantity: 3, availableCopies: 2, status: "available" },
  { title: "Educated", author: "Tara Westover", isbn: "9780399590504", category: "Biography", quantity: 2, availableCopies: 2, status: "available" },
  { title: "The Silent Patient", author: "Alex Michaelides", isbn: "9781250301697", category: "Mystery", quantity: 3, availableCopies: 3, status: "available" },
  { title: "Dune", author: "Frank Herbert", isbn: "9780441172719", category: "Sci-Fi", quantity: 4, availableCopies: 4, status: "available" },
  { title: "Steve Jobs", author: "Walter Isaacson", isbn: "9781451648539", category: "Biography", quantity: 2, availableCopies: 1, status: "available" }
];

const INITIAL_MEMBERS = [
  { name: "Sarah Connor", email: "sarah.c@sky.net", phone: "555-0199", membershipId: "MEM-101" },
  { name: "John Doe", email: "john.doe@gmail.com", phone: "555-0142", membershipId: "MEM-102" },
  { name: "Alice Smith", email: "alice.s@outlook.com", phone: "555-0173", membershipId: "MEM-103" },
  { name: "Bob Johnson", email: "bob.j@yahoo.com", phone: "555-0128", membershipId: "MEM-104" },
  { name: "Clara Oswald", email: "clara.o@tardis.co", phone: "555-0185", membershipId: "MEM-105" },
  { name: "David Miller", email: "david.m@gmail.com", phone: "555-0111", membershipId: "MEM-106" }
];

// Helper structures containing mapping info for transactions & reservations
const RAW_TRANSACTIONS = [
  { bookIsbn: "9780061120084", memberIdStr: "MEM-102", borrowDate: "2026-06-15", dueDate: "2026-06-29", returnDate: null, status: "issued" },
  { bookIsbn: "9780132350884", memberIdStr: "MEM-101", borrowDate: "2026-06-18", dueDate: "2026-07-02", returnDate: null, status: "issued" },
  { bookIsbn: "9780201633610", memberIdStr: "MEM-104", borrowDate: "2026-06-10", dueDate: "2026-06-24", returnDate: null, status: "issued" },
  { bookIsbn: "9781451648539", memberIdStr: "MEM-105", borrowDate: "2026-06-22", dueDate: "2026-07-06", returnDate: null, status: "issued" },
  
  { bookIsbn: "9780743273565", memberIdStr: "MEM-102", borrowDate: "2026-06-01", dueDate: "2026-06-15", returnDate: "2026-06-12", status: "returned" },
  { bookIsbn: "9780553380163", memberIdStr: "MEM-103", borrowDate: "2026-05-28", dueDate: "2026-06-11", returnDate: "2026-06-10", status: "returned" },
  { bookIsbn: "9780062316097", memberIdStr: "MEM-101", borrowDate: "2026-06-05", dueDate: "2026-06-19", returnDate: "2026-06-15", status: "returned" },
  { bookIsbn: "9780441172719", memberIdStr: "MEM-105", borrowDate: "2026-05-15", dueDate: "2026-05-29", returnDate: "2026-05-29", status: "returned" },
  { bookIsbn: "9780547928227", memberIdStr: "MEM-106", borrowDate: "2026-06-08", dueDate: "2026-06-22", returnDate: "2026-06-20", status: "returned" }
];

const RAW_RESERVATIONS = [
  { bookIsbn: "9780061120084", memberIdStr: "MEM-101", reserveDate: "2026-06-20", status: "active" },
  { bookIsbn: "9780547928227", memberIdStr: "MEM-103", reserveDate: "2026-06-22", status: "active" }
];

const seedDB = async () => {
  try {
    await connectDB();
    console.log('Seeding MongoDB database... 🚀');
    
    // Wipe collections
    await Book.deleteMany({});
    await Member.deleteMany({});
    await Transaction.deleteMany({});
    await Reservation.deleteMany({});
    await User.deleteMany({});
    console.log('Wiped existing collections.');

    // 0. Seed Default Admin User
    console.log('Inserting default Admin user...');
    const defaultAdmin = await User.create({
      name: "Admin Librarian",
      email: "admin@lumina.com",
      password: "password123",
      role: "admin"
    });
    console.log('Admin user created successfully.');

    // 1. Bulk insert Books
    console.log('Inserting Books...');
    const insertedBooks = await Book.create(INITIAL_BOOKS);
    console.log(`Inserted ${insertedBooks.length} books.`);

    // 2. Bulk insert Members
    console.log('Inserting Members...');
    const insertedMembers = await Member.create(INITIAL_MEMBERS);
    console.log(`Inserted ${insertedMembers.length} members.`);

    // 3. Map lookups
    const bookMap = {}; // isbn -> _id
    insertedBooks.forEach(b => {
      bookMap[b.isbn] = b._id;
    });

    const memberMap = {}; // membershipId -> _id
    insertedMembers.forEach(m => {
      memberMap[m.membershipId] = m._id;
    });

    // 4. Map and insert Transactions
    console.log('Inserting Transactions...');
    const transactionsToInsert = RAW_TRANSACTIONS.map(txn => {
      const bookId = bookMap[txn.bookIsbn];
      const memberId = memberMap[txn.memberIdStr];
      if (!bookId || !memberId) {
        throw new Error(`Mapping failed for txn of book ${txn.bookIsbn} and member ${txn.memberIdStr}`);
      }
      return {
        bookId,
        memberId,
        issueDate: new Date(txn.borrowDate),
        dueDate: new Date(txn.dueDate),
        returnDate: txn.returnDate ? new Date(txn.returnDate) : null,
        status: txn.status,
        fineAmount: 0
      };
    });
    const insertedTxns = await Transaction.create(transactionsToInsert);
    console.log(`Inserted ${insertedTxns.length} transactions.`);

    // 5. Map and insert Reservations
    console.log('Inserting Reservations...');
    const reservationsToInsert = RAW_RESERVATIONS.map(res => {
      const bookId = bookMap[res.bookIsbn];
      const memberId = memberMap[res.memberIdStr];
      if (!bookId || !memberId) {
        throw new Error(`Mapping failed for reservation of book ${res.bookIsbn} and member ${res.memberIdStr}`);
      }
      return {
        bookId,
        memberId,
        reservationDate: new Date(res.reserveDate),
        status: res.status
      };
    });
    const insertedRes = await Reservation.create(reservationsToInsert);
    console.log(`Inserted ${insertedRes.length} reservations.`);

    // 6. Update Book status field dynamically based on available copies and reservations
    console.log('Updating initial book statuses...');
    for (const book of insertedBooks) {
      if (book.availableCopies === 0) {
        book.status = 'borrowed';
        await book.save();
      } else {
        const hasRes = insertedRes.some(r => r.bookId.toString() === book._id.toString() && r.status === 'active');
        if (hasRes) {
          book.status = 'reserved';
          await book.save();
        }
      }
    }

    console.log('Database seeded successfully! 🌱');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database: ❌', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDB();
