const session = require("express-session");
const Home = require("../modals/home");

const User = require("../modals/user")
const Booking = require('../modals/booking');
const mongoose = require('mongoose');
const Reservation = require('../modals/reservation');
const Billing = require('../modals/billing');
const { sendGuestConfirmationEmail, sendHostAlertEmail } = require('../utils/email');



// exports.gethome = (req, res, next) => {
//     console.log("sessionValue", req.session)
//     Home.find().then(registerHouse => {
//         res.render('store/home', {
//             registerHouse: registerHouse, currentPage: 'home',
//             isLoggedIn: req.isLoggedIn,
//             user: req.session.user,
//             userType: req.session.userType,
//         });
//     });
// };

exports.gethome = async (req, res, next) => {
    try {
        const registerHouse = await Home.find();

        res.render('store/home', {
            registerHouse,
            currentPage: 'home',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
            userType: req.session.userType,
        });
    } catch (err) {
        console.error("Error fetching homes:", err);
        res.status(500).send("Database error");
    }
};


exports.booking = async (req, res, next) => {
    try {
        const userId = req.session.user ? req.session.user._id : null;

        let reservations = [];

        if (userId) {
            const userBooking = await Booking.findOne({ userId });
            const validHomeIds = userBooking ? userBooking.home.map(h => h.toString()) : [];

            const rawReservations = await Reservation.find({ userId: userId, status: 'Paid' }).populate('homeId').populate('billingId');

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            for (let resv of rawReservations) {
                let shouldDelete = false;

                if (!resv.homeId) {
                    // Home was deleted from DB, so we completely delete the booking
                    shouldDelete = true;
                } else {
                    const idx = validHomeIds.indexOf(resv.homeId._id.toString());
                    if (idx === -1) {
                        // Booking was removed from the user's Booking schema, clean up reservation
                        shouldDelete = true;
                    } else {
                        // Found a matching booking in the schema, consume it so duplicates match exactly
                        validHomeIds.splice(idx, 1);

                        const checkOutDate = new Date(resv.checkOut);
                        checkOutDate.setHours(0, 0, 0, 0);

                        if (checkOutDate < currentDate) {
                            shouldDelete = true; // Checkout date has expired
                        }
                    }
                }

                if (shouldDelete) {
                    // Delete the Reservation
                    await Reservation.findByIdAndDelete(resv._id);

                    // Delete the Billing record if it exists
                    if (resv.billingId) {
                        await Billing.findByIdAndDelete(resv.billingId._id || resv.billingId);
                    }

                    // Remove from User's Booking list
                    if (resv.homeId) {
                        const userBooking = await Booking.findOne({ userId });
                        if (userBooking) {
                            userBooking.home = userBooking.home.filter(hId => hId.toString() !== resv.homeId._id.toString());
                            if (userBooking.home.length === 0) {
                                await Booking.deleteOne({ userId });
                            } else {
                                await userBooking.save();
                            }
                        }
                    }
                } else {
                    reservations.push(resv);
                }
            }
        }

        res.render('store/booking', {
            currentPage: 'booking',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
            userType: req.session.userType,
            reservations: reservations
        });
    } catch (err) {
        console.error("Error loading booking page:", err);
        res.status(500).send("Internal Server Error");
    }
};

exports.getBookingDetails = async (req, res, next) => {
    try {
        const homeId = req.params.homeId;
        const home = await Home.findById(homeId);

        if (!home) return res.redirect('/');

        res.render('store/booking-details', {
            home: home,
            currentPage: 'booking',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
            userType: req.session.userType
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};

exports.postBookingDetails = async (req, res, next) => {
    try {
        const { homeId, checkIn, checkOut, members, billingId } = req.body;
        const userId = req.session.user._id;

        // 1. Create Reservation
        const reservation = new Reservation({
            userId,
            homeId,
            billingId,
            checkIn,
            checkOut,
            members
        });
        await reservation.save();

        // Removed sending Host Email here. Now sent after payment succeeds.

        // 3. Redirect to Payment with reservation ID
        res.redirect(`/payment/${reservation._id}`);
    } catch (err) {
        console.error("Error in postBookingDetails:", err);
        res.redirect('/');
    }
};

exports.getPayment = async (req, res, next) => {
    try {
        const reservationId = req.params.reservationId;
        const reservation = await Reservation.findById(reservationId).populate('homeId');

        if (!reservation) {
            return res.redirect('/');
        }

        res.render('store/payment', {
            reservation: reservation,
            home: reservation.homeId,
            currentPage: 'booking',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
            userType: req.session.userType
        });
    } catch (err) {
        console.error("Error loading payment page:", err);
        res.redirect('/');
    }
};





exports.postbooking = async (req, res, next) => {
    try {
        console.log("this is from postbooking");

        const reservationId = req.body.reservationId;
        const paymentMethod = req.body.paymentMethod || "Credit / Debit Card";
        const userId = req.session.user ? req.session.user._id : null;

        if (!userId || !reservationId) {
            return res.status(400).send("User ID or Reservation ID missing");
        }

        // Get reservation
        const reservation = await Reservation.findById(reservationId).populate('homeId');
        if (!reservation) return res.status(404).send("Reservation not found");

        const homeId = reservation.homeId._id;

        // Find or create booking
        let userBooking = await Booking.findOne({ userId });

        if (userBooking) {
            userBooking.home.push(homeId);
            await userBooking.save();
        } else {
            userBooking = new Booking({
                userId,
                home: [homeId]
            });
            await userBooking.save();
        }

        // Update reservation status
        reservation.status = 'Paid';
        await reservation.save();

        if (reservation.billingId) {
            await Billing.findByIdAndUpdate(reservation.billingId, {
                status: 'paid',
                booking: userBooking._id
            });

            userBooking.billing = reservation.billingId;
            const currentBill = await Billing.findById(reservation.billingId);
            userBooking.totalPrice = (userBooking.totalPrice || 0) + (currentBill ? currentBill.totalAmount : 0);
            userBooking.status = 'confirmed';
            await userBooking.save();
        }

        // Send Email to Guest and Host
        try {
            const homeDetails = await Home.findById(homeId);
            let hostName = "Host";
            let hostEmail = null;
            if (homeDetails.userId) {
                const hostUser = await User.findById(homeDetails.userId);
                if (hostUser) {
                    hostName = hostUser.firstName;
                    hostEmail = hostUser.email;
                }
            }

            await sendGuestConfirmationEmail({
                guestEmail: req.session.user.email,
                guestName: req.session.user.firstName,
                hostName: hostName,
                homeTitle: homeDetails.houseName,
                checkIn: reservation.checkIn.toISOString().split('T')[0],
                checkOut: reservation.checkOut.toISOString().split('T')[0],
                guestsCount: reservation.members,
                totalPrice: homeDetails.price
            });

            if (hostEmail) {
                await sendHostAlertEmail({
                    hostEmail: hostEmail,
                    hostName: hostName,
                    guestName: req.session.user.firstName,
                    guestId: req.session.user._id,
                    guestEmail: req.session.user.email,
                    homeTitle: homeDetails.houseName,
                    checkIn: reservation.checkIn.toISOString().split('T')[0],
                    checkOut: reservation.checkOut.toISOString().split('T')[0],
                    guestsCount: reservation.members,
                    totalPrice: homeDetails.price,
                    paymentMethod: paymentMethod
                });
            }
        } catch (emailError) {
            console.error("Error sending guest booking email:", emailError);
        }

        // Fetch all booked homes to show in EJS
        const reservations = await Reservation.find({ userId: userId, status: 'Paid' }).populate('homeId').populate('billingId');

        res.render('store/booking', {
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
            currentPage: 'booking',
            reservations: reservations,
            userType: req.session.userType,

        });

    } catch (error) {
        console.error("Error in postbooking:", error);
        res.status(500).send("Internal server error");
    }
};

exports.postremovebooking = async (req, res, next) => {
    console.log('Form postremovebooking triggered');
    try {
        const homeId = req.params.homeId;
        const userId = req.session.user._id;

        console.log("UserId:", userId);
        console.log("homeId:", homeId);

        const userBooking = await Booking.findOne({ userId });

        if (!userBooking) {
            return res.redirect('/booking');
        }

        const index = userBooking.home.findIndex(booking => booking.toString() === homeId.toString());
        if (index > -1) {
            userBooking.home.splice(index, 1);
        }

        if (userBooking.home.length === 0) {
            // ✅ If no more bookings, delete the entire Booking document
            await Booking.deleteOne({ userId });
            console.log("Booking deleted.");
        } else {
            // ✅ Save updated booking list
            await userBooking.save();
            console.log("Home removed from booking.");
        }

        res.redirect('/booking');
    } catch (err) {
        console.error("Error in postremovebooking:", err);
        res.status(500).send("Internal Server Error");
    }
};





exports.homelist = async (req, res, next) => {
    try {
        const registerHouse = await Home.find();

        res.render('store/home-list', {
            registerHouse: registerHouse,
            currentPage: 'homelist',
            user: req.session.user,
            isLoggedIn: req.isLoggedIn,
            userType: req.session.userType,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
};



exports.postaddtoFavourite = async (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).send("User not logged in.");
    }
    // const userId = req.session.user._id;

    const homeId = req.body.homeId || req.body.id;
    const userId = req.session.user._id;
    const user = await User.findById(userId)
    // if (!user.favourite.includes(homeId)) {
    //     user.favourite.push(homeId);
    //     await user.save();
    // }
    if (!user.favourite.includes(homeId)) {
        user.favourite.push(homeId);
        await user.save(); // or update DB accordingly
        req.session.user.favourite = user.favourite;
    }
    req.session.save(() => {
        res.redirect('/favourite'); // redirect back so user stays on the same page
    });
};




exports.getFavourite = async (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).send("User not logged in.");
    }
    const userId = req.session.user._id;
    const user = await User.findById(userId).populate('favourite')
    console.log(user)
    res.render('store/favourite-list', {
        favouriteHomes: user.favourite || [],
        currentPage: 'favourite',
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        userType: req.session.userType,
    });


};


exports.homeDeatail = async (req, res, next) => {
    try {
        const homeId = req.params.homeId;
        console.log(req.file);

        const home = await Home.findById(homeId);
        if (!home) {
            return res.redirect('/homelist');
        }

        console.log("home deatail found", home);
        return res.render('store/home-detail', {
            home: home,
            currentPage: 'homelist',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
            userType: req.session.userType,
        });
    } catch (err) {
        console.error(err);
        res.redirect('/homelist');
    }
};

exports.postremoveFavourite = async (req, res, next) => {
    const homeId = req.params.homeId;
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    user.favourite = user.favourite.filter(fav => fav.toString() !== homeId.toString());
    await user.save();
    req.session.user.favourite = user.favourite;
    req.session.save(() => {
        res.redirect('/favourite');
    });
};

// render user profile page – linked from navbar
exports.profile = async (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }

    const user = req.session.user;
    const userId = user._id;
    const userRole = user.userType; // 'guest' or 'host'

    try {
        let bookingsData = [];

        if (userRole === 'guest') {
            // Fetch bookings made by this user
            const reservations = await Reservation.find({ userId: userId }).populate('homeId');

            bookingsData = reservations.map(resv => {
                let homeImage = null;
                if (resv.homeId) {
                    if (resv.homeId.photo) homeImage = resv.homeId.photo;
                    else if (resv.homeId.photos && resv.homeId.photos.length > 0) homeImage = resv.homeId.photos[0];
                }

                return {
                    homeTitle: resv.homeId ? resv.homeId.houseName : 'Home Unavailable',
                    homeImage: homeImage,
                    checkInDate: resv.checkIn,
                    checkOutDate: resv.checkOut,
                    status: resv.status
                };
            });

        } else if (userRole === 'host') {
            // Find homes created by the host
            const hostHomes = await Home.find({ userId: userId });
            const hostHomeIds = hostHomes.map(h => h._id);

            // Find bookings for those homes
            const reservations = await Reservation.find({ homeId: { $in: hostHomeIds } })
                .populate('userId')
                .populate('homeId');

            bookingsData = reservations.map(resv => ({
                homeTitle: resv.homeId ? resv.homeId.houseName : 'Home Unavailable',
                guestName: resv.userId ? `${resv.userId.firstName} ${resv.userId.lastName || ''}`.trim() : 'Unknown Guest',
                guestEmail: resv.userId ? resv.userId.email : 'No Email',
                checkInDate: resv.checkIn,
                checkOutDate: resv.checkOut,
                status: resv.status
            }));
        }

        // Return structured JSON if requested via API (frontend rendering), otherwise render EJS
        if (req.xhr || req.headers.accept.indexOf('application/json') > -1) {
            return res.json({ bookingsData });
        }

        res.render('store/profile', {
            currentPage: 'profile',
            isLoggedIn: req.isLoggedIn,
            user: user,
            userType: userRole,
            bookingsData: bookingsData
        });
    } catch (err) {
        console.error("Error fetching profile data:", err);
        res.status(500).send("Internal Server Error");
    }
};

exports.getHomeRules = [(req, res, next) => {

    if (!req.session.isLoggedIn) {
        return res.redirect("/login")
    }
    next()
},
(req, res, next) => {
    const homeId = req.params.homeId;
    const rulesFileName = `houseRules-${homeId}.pdf`;
    const filepath = path.join(rootDir, 'rules', rulesFileName)
    res.download(filepath, "Rules.pdf")

}
]

exports.viewInvoice = async (req, res, next) => {
    try {
        const reservationId = req.params.reservationId;
        const reservation = await Reservation.findById(reservationId).populate('homeId').populate('billingId').populate('userId');

        // Ensure reservation and its billing exist before proceeding
        if (!reservation || !reservation.billingId) {
            console.log("Invoice not found or billing is missing for reservation:", reservationId);
            return res.redirect('/booking');
        }

        let host = null;
        if (reservation.homeId && reservation.homeId.userId) {
            host = await User.findById(reservation.homeId.userId);
        }

        res.render('store/invoice', {
            reservation: reservation,
            billing: reservation.billingId,
            home: reservation.homeId,
            guest: reservation.userId,
            host: host,
            currentPage: 'booking',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
            userType: req.session.userType
        });
    } catch (err) {
        console.error("Error loading invoice:", err);
        res.redirect('/booking');
    }
};
