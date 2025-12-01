const session = require("express-session");
const Home = require("../modals/home");
 
const User = require("../modals/user")
const Booking = require('../modals/booking');
const mongoose = require('mongoose');   // ✅ Add this



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
 
   let  bookedHomes =[]

        if (userId) {
            const userBooking = await Booking.findOne({ userId }).populate('home');
            bookedHomes = userBooking ? userBooking.home : [];
        }

        res.render('store/booking', {
            currentPage: 'booking',
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
            userType: req.session.userType,
            bookedHomes: bookedHomes
        });
    } catch (err) {
        console.error("Error loading booking page:", err);
        res.status(500).send("Internal Server Error");
    }
};

 

 

exports.postbooking = async (req, res, next) => {
    try {
        console.log("this is from postbooking");
        console.log("Request body:", req.body);

        const homeId = req.body.homeId || req.body.id;
        const userId = req.session.user ? req.session.user._id : null;
        const bookingDate = req.body.bookingDate;
        const people = parseInt(req.body.people);


        if (!userId || !homeId) {
            return res.status(400).send("User ID or Home ID missing");
        }

        console.log("UserId:", userId);
        console.log("homeId:", homeId);

        // Find or create booking
        let userBooking = await Booking.findOne({ userId });

        if (userBooking) {
            if (!userBooking.home.includes(homeId)) {
                userBooking.home.push(homeId);
                await userBooking.save();
            }
        } else {
            userBooking = new Booking({
                userId,
                home: [homeId]
            });
            await userBooking.save();
        }

        // 🆕 Fetch all booked homes to show in EJS
        const fullBooking = await Booking.findOne({ userId }).populate('home');
        const bookedHomes = fullBooking ? fullBooking.home : [];

console.log("Full booking data with populated homeId:", JSON.stringify(fullBooking, null, 2));

        res.render('store/booking', {
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
            currentPage: 'booking',
            bookedHomes: bookedHomes, // ✅ pass it to EJS
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

        // ✅ Filter out the specific booking entry by homeId
        userBooking.home = userBooking.home.filter(booking => 
            booking.toString() !== homeId
        );

        if (userBooking.home.length === 0) {
            // ✅ If no more bookings, delete the entire Booking & User
            await Booking.deleteOne({ userId });
            await User.deleteOne({ userId });
            console.log("Booking and user deleted.");
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





exports.homelist = (req, res, next) => {
    Home.find().then(registerHouse => {
        res.render('store/home-list', {
            registerHouse: registerHouse, currentPage: 'homelist',
            user: req.session.user,
            isLoggedIn: req.isLoggedIn,
            userType: req.session.userType,
        })
    });
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
    }
    res.redirect('/favourite');

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


exports.homeDeatail = (req, res, next) => {
    const homeId = req.params.homeId;
    console.log(req.file)


    Home.findById(homeId).then(home => {
        if (!home) {
            res.redirect('/homelist');
        } else {
            console.log("home deatail found", home);
            return res.render('store/home-detail', {
                home: home,
                currentPage: 'homelist',
                isLoggedIn: req.isLoggedIn,
                user: req.session.user,
                userType: req.session.userType,
            });
        }
    });
};

exports.postremoveFavourite = async (req, res, next) => {
    const homeId = req.params.homeId;
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    user.favourite = user.favourite.filter(fav => fav != homeId);
    await user.save();
    res.redirect('/favourite');
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

