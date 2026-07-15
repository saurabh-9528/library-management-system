const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const mongoose = require('mongoose');
const { Book, Member, Transaction, Reservation, User } = require('./models');

const PORT = 5999;
let server;

// Helper to make HTTP requests using Node.js built-in 'http' module
const makeRequest = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, rawBody: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('Connecting to MongoDB...');
  await connectDB();
  
  console.log('Resetting Database...');
  await Book.deleteMany({});
  await Member.deleteMany({});
  await Transaction.deleteMany({});
  await Reservation.deleteMany({});
  await User.deleteMany({});

  server = app.listen(PORT, async () => {
    console.log(`Test Server listening on port ${PORT}\n`);
    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
      if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
      }
    };

    let authToken = null;
    let createdBookId;
    let createdMemberId;
    let createdTxnId;
    let createdResId;

    try {
      // ----------------------------------------------------
      // TEST 1: Hit Protected Route Unauthenticated
      // ----------------------------------------------------
      console.log('Testing: GET /api/dashboard/stats (Unauthenticated)');
      const unauthRes = await makeRequest('GET', '/api/dashboard/stats');
      assert(unauthRes.statusCode === 401, 'Endpoint rejected request with 401');
      assert(unauthRes.body.success === false, 'Stats success is false');
      assert(unauthRes.body.message.includes('not logged in'), 'Error message warns user is not logged in');

      // ----------------------------------------------------
      // TEST 2: Register Admin
      // ----------------------------------------------------
      console.log('\nTesting: POST /api/auth/register (Register)');
      const registerData = {
        name: 'Super Admin',
        email: 'admin@lumina.com',
        password: 'password123',
        role: 'admin'
      };
      const registerRes = await makeRequest('POST', '/api/auth/register', registerData);
      assert(registerRes.statusCode === 211, 'Register status is 211');
      assert(registerRes.body.token !== undefined, 'Register issued a JWT token');
      assert(registerRes.body.data.user.email === 'admin@lumina.com', 'Registered correct email');
      
      // Save token for subsequent tests
      authToken = registerRes.body.token;

      // ----------------------------------------------------
      // TEST 3: Login User
      // ----------------------------------------------------
      console.log('\nTesting: POST /api/auth/login (Login)');
      const loginData = {
        email: 'admin@lumina.com',
        password: 'password123'
      };
      const loginRes = await makeRequest('POST', '/api/auth/login', loginData);
      assert(loginRes.statusCode === 200, 'Login status is 200');
      assert(loginRes.body.token !== undefined, 'Login issued a JWT token');
      assert(loginRes.body.data.user.name === 'Super Admin', 'Logged in successfully');

      // ----------------------------------------------------
      // TEST 4: Get Stats (Authenticated)
      // ----------------------------------------------------
      console.log('\nTesting: GET /api/dashboard/stats (Authenticated)');
      const statsRes = await makeRequest('GET', '/api/dashboard/stats', null, authToken);
      assert(statsRes.statusCode === 200, 'Authenticated Stats status is 200');
      assert(statsRes.body.success === true, 'Authenticated Stats success is true');
      assert(statsRes.body.data.totalBooks === 0, 'Initial books count is 0');

      // ----------------------------------------------------
      // TEST 5: Add Book
      // ----------------------------------------------------
      console.log('\nTesting: POST /api/books (Add Book)');
      const bookData = {
        title: 'Mongoose Mastering',
        author: 'John Schemer',
        isbn: '978-3-16-148410-0',
        category: 'Technology',
        quantity: 5
      };
      const addBookRes = await makeRequest('POST', '/api/books', bookData, authToken);
      assert(addBookRes.statusCode === 211, 'Add Book status is 211');
      assert(addBookRes.body.data._id !== undefined, 'Add Book returned an ObjectId');
      assert(addBookRes.body.data.availableCopies === 5, 'New book has correct available copies');
      createdBookId = addBookRes.body.data._id;

      // ----------------------------------------------------
      // TEST 6: Add Member
      // ----------------------------------------------------
      console.log('\nTesting: POST /api/members (Add Member)');
      const memberData = {
        name: 'Mongoose Tester',
        email: 'mongoose@test.com',
        phone: '999-888-7777',
        membershipId: 'MEM-T99'
      };
      const addMemberRes = await makeRequest('POST', '/api/members', memberData, authToken);
      assert(addMemberRes.statusCode === 211, 'Add Member status is 211');
      assert(addMemberRes.body.data._id !== undefined, 'Add Member returned an ObjectId');
      createdMemberId = addMemberRes.body.data._id;

      // ----------------------------------------------------
      // TEST 7: Get All Books & Get Book by ID
      // ----------------------------------------------------
      console.log('\nTesting: GET /api/books & GET /api/books/:id');
      const getBooksRes = await makeRequest('GET', '/api/books', null, authToken);
      assert(getBooksRes.statusCode === 200, 'Get Books status is 200');
      assert(getBooksRes.body.data.length === 1, 'Books list has 1 book');

      const getBookByIdRes = await makeRequest('GET', `/api/books/${createdBookId}`, null, authToken);
      assert(getBookByIdRes.statusCode === 200, 'Get Book by ID status is 200');
      assert(getBookByIdRes.body.data.title === 'Mongoose Mastering', 'Fetched correct book details');

      // ----------------------------------------------------
      // TEST 8: Update Book
      // ----------------------------------------------------
      console.log('\nTesting: PUT /api/books/:id (Update Book)');
      const updateBookRes = await makeRequest('PUT', `/api/books/${createdBookId}`, { title: 'Mongoose Mastering (Updated)' }, authToken);
      assert(updateBookRes.statusCode === 200, 'Update Book status is 200');
      assert(updateBookRes.body.data.title === 'Mongoose Mastering (Updated)', 'Title was updated successfully');

      // ----------------------------------------------------
      // TEST 9: Transaction - Issue Book (Borrow)
      // ----------------------------------------------------
      console.log('\nTesting: POST /api/transactions/borrow (Issue Book)');
      const borrowRes = await makeRequest('POST', '/api/transactions/borrow', {
        bookId: createdBookId,
        memberId: createdMemberId,
        dueDate: '2026-08-01'
      }, authToken);
      assert(borrowRes.statusCode === 211, 'Borrow book status is 211');
      assert(borrowRes.body.data.bookId._id === createdBookId, 'Transaction records book ID');
      createdTxnId = borrowRes.body.data._id;

      // Verify book availableCopies decreased to 4
      const bookAfterBorrow = await makeRequest('GET', `/api/books/${createdBookId}`, null, authToken);
      assert(bookAfterBorrow.body.data.availableCopies === 4, 'Book availableCopies is now 4');

      // ----------------------------------------------------
      // TEST 10: Transaction History
      // ----------------------------------------------------
      console.log('\nTesting: GET /api/transactions/history');
      const historyRes = await makeRequest('GET', '/api/transactions/history', null, authToken);
      assert(historyRes.statusCode === 200, 'History status is 200');
      assert(historyRes.body.data.length === 1, 'History has 1 transaction');

      // ----------------------------------------------------
      // TEST 11: Return Book
      // ----------------------------------------------------
      console.log('\nTesting: POST /api/transactions/return (Return Book)');
      const returnRes = await makeRequest('POST', '/api/transactions/return', { txnId: createdTxnId }, authToken);
      assert(returnRes.statusCode === 200, 'Return book status is 200');
      assert(returnRes.body.data.returnDate !== null, 'Return date is updated');

      const bookAfterReturn = await makeRequest('GET', `/api/books/${createdBookId}`, null, authToken);
      assert(bookAfterReturn.body.data.availableCopies === 5, 'Book availableCopies is now 5 again');

      // ----------------------------------------------------
      // TEST 12: Reservation - Reserve Book
      // ----------------------------------------------------
      console.log('\nTesting: POST /api/reservations/reserve (Reserve Book)');
      const reserveRes = await makeRequest('POST', '/api/reservations/reserve', {
        bookId: createdBookId,
        memberId: createdMemberId
      }, authToken);
      assert(reserveRes.statusCode === 211, 'Reserve status is 211');
      assert(reserveRes.body.data.status === 'active', 'Reservation is active');
      createdResId = reserveRes.body.data._id;

      const bookAfterReserve = await makeRequest('GET', `/api/books/${createdBookId}`, null, authToken);
      assert(bookAfterReserve.body.data.status === 'reserved', 'Book status is now "reserved" due to active reservation');

      // ----------------------------------------------------
      // TEST 13: Reservation - Cancel Reservation
      // ----------------------------------------------------
      console.log('\nTesting: POST /api/reservations/cancel (Cancel Reservation)');
      const cancelRes = await makeRequest('POST', '/api/reservations/cancel', { resId: createdResId }, authToken);
      assert(cancelRes.statusCode === 200, 'Cancel status is 200');
      assert(cancelRes.body.data.status === 'cancelled', 'Reservation status is cancelled');

      const bookAfterCancel = await makeRequest('GET', `/api/books/${createdBookId}`, null, authToken);
      assert(bookAfterCancel.body.data.status === 'available', 'Book status reverted to "available" again');

      // ----------------------------------------------------
      // TEST 13B: Validation - Prevent Duplicate Active Issue
      // ----------------------------------------------------
      console.log('\nTesting: Validation - Prevent Duplicate Active Issue');
      // First borrow: successful
      const firstBorrow = await makeRequest('POST', '/api/transactions/borrow', {
        bookId: createdBookId,
        memberId: createdMemberId,
        dueDate: '2026-08-01'
      }, authToken);
      assert(firstBorrow.statusCode === 211, 'First borrow succeeded');
      
      // Second borrow of same book by same member: blocked
      const secondBorrow = await makeRequest('POST', '/api/transactions/borrow', {
        bookId: createdBookId,
        memberId: createdMemberId,
        dueDate: '2026-08-01'
      }, authToken);
      assert(secondBorrow.statusCode === 400, 'Duplicate borrow blocked with 400');
      assert(secondBorrow.body.message.includes('already has an active loan'), 'Returns duplicate active loan error message');

      // Return the book to clean up
      await makeRequest('POST', '/api/transactions/return', { txnId: firstBorrow.body.data._id }, authToken);

      // ----------------------------------------------------
      // TEST 13C: Validation - Prevent Duplicate Active Reservation
      // ----------------------------------------------------
      console.log('\nTesting: Validation - Prevent Duplicate Active Reservation');
      // First reservation: successful
      const firstRes = await makeRequest('POST', '/api/reservations/reserve', {
        bookId: createdBookId,
        memberId: createdMemberId
      }, authToken);
      assert(firstRes.statusCode === 211, 'First reservation succeeded');
      
      // Second reservation: blocked
      const secondRes = await makeRequest('POST', '/api/reservations/reserve', {
        bookId: createdBookId,
        memberId: createdMemberId
      }, authToken);
      assert(secondRes.statusCode === 400, 'Duplicate reservation blocked with 400');
      assert(secondRes.body.message.includes('already has an active reservation'), 'Returns duplicate reservation error message');

      // Cancel the reservation to clean up
      await makeRequest('POST', '/api/reservations/cancel', { resId: firstRes.body.data._id }, authToken);

      // ----------------------------------------------------
      // TEST 13D: Validation - Phone Number Format Validation
      // ----------------------------------------------------
      console.log('\nTesting: Validation - Reject Invalid Phone Number Format');
      const badPhoneMember = {
        name: 'Bad Phone User',
        email: 'badphone@test.com',
        phone: 'invalid-phone-abc', // letters not allowed
        membershipId: 'MEM-TBAD'
      };
      const badPhoneRes = await makeRequest('POST', '/api/members', badPhoneMember, authToken);
      assert(badPhoneRes.statusCode === 400, 'Invalid phone registered was blocked with 400');
      assert(badPhoneRes.body.message.includes('Phone number must be a valid format'), 'Returns phone format schema validation error');

      // ----------------------------------------------------
      // TEST 14: Delete Member & Delete Book (Cleanup)
      // ----------------------------------------------------
      console.log('\nTesting: DELETE /api/members/:id & DELETE /api/books/:id');
      const deleteMemberRes = await makeRequest('DELETE', `/api/members/${createdMemberId}`, null, authToken);
      assert(deleteMemberRes.statusCode === 200, 'Delete member status is 200');

      const deleteBookRes = await makeRequest('DELETE', `/api/books/${createdBookId}`, null, authToken);
      assert(deleteBookRes.statusCode === 200, 'Delete book status is 200');

      // ----------------------------------------------------
      // TEST 15: Logout User
      // ----------------------------------------------------
      console.log('\nTesting: POST /api/auth/logout (Logout)');
      const logoutRes = await makeRequest('POST', '/api/auth/logout', null, authToken);
      assert(logoutRes.statusCode === 200, 'Logout status is 200');
      assert(logoutRes.body.success === true, 'Logged out successfully');

      console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
    } catch (err) {
      console.error('Error during test execution:', err);
      failed++;
    } finally {
      console.log('Closing server and database connections...');
      server.close(() => {
        console.log('Server closed.');
        mongoose.connection.close().then(() => {
          console.log('Database connection closed.');
          process.exit(failed > 0 ? 1 : 0);
        });
      });
    }
  });
};

runTests();
