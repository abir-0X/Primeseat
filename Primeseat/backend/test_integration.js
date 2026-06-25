const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const OTP = require('./models/OTP');
const Event = require('./models/Event');
const Booking = require('./models/Booking');

dotenv.config();

// Override port to 5001 to prevent conflicts
process.env.PORT = 5001;

// Require server.js to start the server
const server = require('./server');

const BASE_URL = 'http://localhost:5001/api';

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('🚀 Starting Primeseat Backend Integration Tests...');
    
    // Wait dynamically for Mongoose to connect
    console.log('⏳ Waiting for MongoDB connection...');
    while (mongoose.connection.readyState !== 1) {
        await wait(500);
    }
    console.log('✅ MongoDB connection established.');

    let userToken = '';
    let adminToken = '';
    let eventId = '';
    let bookingId = '';

    try {
        // Clean up any stale test user data from previous runs
        await User.deleteOne({ email: 'test_user@primeseat.com' });
        await OTP.deleteMany({ email: 'test_user@primeseat.com' });

        // 1. Register User
        console.log('\n--- Test 1: Register User ---');
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test_user@primeseat.com',
                password: 'password123'
            })
        });
        const regData = await regRes.json();
        if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
        console.log('✅ Registration request success:', regData.message);

        // 2. Fetch OTP from DB
        console.log('\n--- Test 2: Fetch Account Verification OTP from DB ---');
        const dbOTP = await OTP.findOne({ email: 'test_user@primeseat.com', action: 'account_verification' });
        if (!dbOTP) throw new Error('OTP not found in database!');
        console.log('✅ OTP fetched successfully:', dbOTP.otp);

        // 3. Verify OTP
        console.log('\n--- Test 3: Verify OTP ---');
        const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test_user@primeseat.com',
                otp: dbOTP.otp
            })
        });
        const verifyData = await verifyRes.json();
        if (verifyRes.status !== 200) throw new Error(`Verification failed: ${JSON.stringify(verifyData)}`);
        userToken = verifyData.token;
        console.log('✅ Account verified successfully. Token acquired.');

        // 4. Admin Login
        console.log('\n--- Test 4: Admin Login ---');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@primeseat.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        if (loginRes.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
        adminToken = loginData.token;
        console.log('✅ Admin logged in. Token acquired.');

        // 5. Create Event (Admin)
        console.log('\n--- Test 5: Create Event (Admin) ---');
        const eventRes = await fetch(`${BASE_URL}/events`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: 'Integration Test Conference',
                description: 'A temporary conference for integration testing.',
                date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                location: 'Test Arena, New York',
                category: 'Technology',
                totalSeats: 10,
                ticketPrice: 100
            })
        });
        const eventData = await eventRes.json();
        if (eventRes.status !== 201) throw new Error(`Event creation failed: ${JSON.stringify(eventData)}`);
        eventId = eventData._id || eventData.id;
        console.log('✅ Event created successfully. ID:', eventId);

        // 6. Request Booking OTP (User)
        console.log('\n--- Test 6: Request Booking OTP (User) ---');
        const bOtpRes = await fetch(`${BASE_URL}/bookings/send-otp`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            }
        });
        const bOtpData = await bOtpRes.json();
        if (bOtpRes.status !== 200) throw new Error(`Booking OTP request failed: ${JSON.stringify(bOtpData)}`);
        console.log('✅ Booking OTP requested successfully.');

        // 7. Get Booking OTP from DB
        console.log('\n--- Test 7: Fetch Booking OTP from DB ---');
        const dbBookingOTP = await OTP.findOne({ email: 'test_user@primeseat.com', action: 'event_booking' });
        if (!dbBookingOTP) throw new Error('Booking OTP not found in database!');
        console.log('✅ Booking OTP fetched successfully:', dbBookingOTP.otp);

        // 8. Book Event with OTP (User)
        console.log('\n--- Test 8: Book Event with OTP (User) ---');
        const bookRes = await fetch(`${BASE_URL}/bookings`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                eventId,
                otp: dbBookingOTP.otp
            })
        });
        const bookData = await bookRes.json();
        if (bookRes.status !== 201) throw new Error(`Booking failed: ${JSON.stringify(bookData)}`);
        bookingId = bookData.booking?._id || bookData._id;
        console.log('✅ Booking created successfully. ID:', bookingId, 'Status:', bookData.booking?.status);

        // 9. Get User's Bookings
        console.log('\n--- Test 9: Get User\'s Bookings ---');
        const myBookingsRes = await fetch(`${BASE_URL}/bookings/my`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const myBookings = await myBookingsRes.json();
        if (myBookingsRes.status !== 200) throw new Error(`Fetch bookings failed: ${JSON.stringify(myBookings)}`);
        const testBooking = myBookings.find(b => b._id.toString() === bookingId.toString());
        if (!testBooking) throw new Error('Created booking not found in My Bookings list!');
        console.log('✅ Found booking in My Bookings. Status:', testBooking.status, 'Payment Status:', testBooking.paymentStatus);

        // 10. Update Booking Status (Admin)
        console.log('\n--- Test 10: Update Booking Status (Admin) ---');
        const statusRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: 'confirmed' })
        });
        const statusData = await statusRes.json();
        if (statusRes.status !== 200) throw new Error(`Status update failed: ${JSON.stringify(statusData)}`);
        console.log('✅ Booking status updated to confirmed:', statusData.message);

        // 11. Update Payment Status (Admin)
        console.log('\n--- Test 11: Update Payment Status (Admin) ---');
        const payRes = await fetch(`${BASE_URL}/bookings/${bookingId}/payment`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ paymentStatus: 'paid' })
        });
        const payData = await payRes.json();
        if (payRes.status !== 200) throw new Error(`Payment update failed: ${JSON.stringify(payData)}`);
        console.log('✅ Payment status updated to paid:', payData.message);

        // 12. Verify Updates on User's End
        console.log('\n--- Test 12: Verify Updates (User) ---');
        const myBookingsRes2 = await fetch(`${BASE_URL}/bookings/my`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const myBookings2 = await myBookingsRes2.json();
        const updatedBooking = myBookings2.find(b => b._id.toString() === bookingId.toString());
        if (!updatedBooking) throw new Error('Updated booking not found!');
        if (updatedBooking.status !== 'confirmed') throw new Error(`Status expected "confirmed" but got "${updatedBooking.status}"`);
        if (updatedBooking.paymentStatus !== 'paid') throw new Error(`Payment status expected "paid" but got "${updatedBooking.paymentStatus}"`);
        console.log('✅ Successfully verified: status is "confirmed" and payment status is "paid".');

        // 13. Fetch Admin Analytics
        console.log('\n--- Test 13: Fetch Admin Analytics ---');
        const analyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const analyticsData = await analyticsRes.json();
        if (analyticsRes.status !== 200) throw new Error(`Fetch analytics failed: ${JSON.stringify(analyticsData)}`);
        console.log('✅ Admin Analytics retrieved successfully:');
        console.log('   Pending Requests:', analyticsData.pendingRequestsCount);
        console.log('   Confirmed Bookings:', analyticsData.confirmedBookingsCount);
        console.log('   Confirmed & Paid Clients:', analyticsData.confirmedPaidClientsCount);
        console.log('   Total Revenue:', analyticsData.totalRevenue);

        // 13.5 Test Event Edit (totalSeats capacity adjustment)
        console.log('\n--- Test 13.5: Edit Event totalSeats capacity adjustment ---');
        // A: Edit totalSeats from 10 to 5 (booked: 1, expected available: 4)
        const editRes1 = await fetch(`${BASE_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ totalSeats: 5 })
        });
        const editData1 = await editRes1.json();
        if (editRes1.status !== 200) throw new Error(`Capacity edit failed: ${JSON.stringify(editData1)}`);
        if (editData1.availableSeats !== 4) throw new Error(`Expected availableSeats to be 4, but got ${editData1.availableSeats}`);
        console.log('✅ Edit event capacity (10 -> 5) succeeded, availableSeats recalculated to 4.');

        // B: Attempt to reduce totalSeats below booked (e.g. to 0, since booked is 1)
        const editRes2 = await fetch(`${BASE_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ totalSeats: 0 })
        });
        const editData2 = await editRes2.json();
        if (editRes2.status !== 400) {
            throw new Error(`Expected status 400 for illegal capacity decrease, but got ${editRes2.status}`);
        }
        console.log('✅ Prevented reducing capacity below booked seats: server returned 400 with message:', editData2.message);

        // 14. Clean Up Test Data
        console.log('\n--- Test 14: Cleanup Test Data ---');
        await Booking.deleteOne({ _id: bookingId });
        await Event.deleteOne({ _id: eventId });
        await User.deleteOne({ email: 'test_user@primeseat.com' });
        await OTP.deleteMany({ email: 'test_user@primeseat.com' });
        console.log('✅ Test data cleaned up successfully.');

        console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ INTEGRATION TEST FAILED:', err.message);
        // Attempt database cleanup on error
        try {
            if (bookingId) await Booking.deleteOne({ _id: bookingId });
            if (eventId) await Event.deleteOne({ _id: eventId });
            await User.deleteOne({ email: 'test_user@primeseat.com' });
            await OTP.deleteMany({ email: 'test_user@primeseat.com' });
        } catch (cleanupErr) {
            console.error('Error during cleanup:', cleanupErr);
        }
        process.exit(1);
    }
}

runTests();
