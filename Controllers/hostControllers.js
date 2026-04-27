
 const Home = require("../modals/home");
 const fs = require('fs');


exports.addhome = (req, res, next) => {

    res.render('host/edit-home', {
        currentPage: 'homeadd', editing: false, isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        userType: req.session.userType,
    });
};

exports.getEditHome = (req, res, next) => {
    const homeId = req.params.homeId;
    const editing = req.query.editing === "true"

    //   console.log(homeId, editing);
    Home.findById(homeId).then(home => {

        // console.log(home);
        if (!home) {
            console.log('Home not found');
            return res.redirect('/host/host-home');
        }
        //    console.log(home,homeId,editing)

        res.render('host/edit-home', {
            currentPage: 'homeadd',
            editing: editing,
            home: home,
            isLoggedIn: req.isLoggedIn,
            user: req.session.user,
            userType: req.session.userType,
        });

    });
};

exports.postaddhome = (req, res, next) => {
  const { houseName, price, location, description, locationUrl, maxGuests, detailedDescription } = req.body;

  let photos = [];
  if (req.files && req.files.length > 0) {
    photos = req.files.map(file => file.path);
  }

  if (photos.length === 0) {
    return res.status(422).send("img is can't provide");
  }

  const photo = photos[0];
  const userId = req.session.user._id;

  const home = new Home({
    houseName,
    price,
    location,
    locationUrl,
    photo,
    photos,
    description,
    detailedDescription,
    maxGuests: maxGuests || 1,
    userId,
  });

  home.save()
    .then(() => {
      console.log("Home added successfully");
      res.redirect('/host/host-home');
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error saving home");
    });
};


exports.postEditHome = (req, res, next) => {
 
    const { id, houseName, price, location, description, locationUrl, maxGuests, detailedDescription } = req.body
    Home.findById(id).then(home => {
        if (!home) {
            console.log('Home not found');
            return res.redirect('/host/host-home');
        }
        home.houseName = houseName;
        home.price = price;
        home.location = location;
        home.locationUrl = locationUrl;
        home.description = description;
        home.detailedDescription = detailedDescription;
        home.maxGuests = maxGuests || 1;
         
        if (req.files && req.files.length > 0) {
            const newPhotos = req.files.map(file => file.path);
            
            if (home.photos && home.photos.length > 0) {
                home.photos.forEach(p => {
                    fs.unlink(p, err => { if (err) console.log("error while deleting file", err); });
                });
            } else if (home.photo) {
                fs.unlink(home.photo, err => { if (err) console.log("error while deleting file", err); });
            }
            
            home.photos = newPhotos;
            home.photo = newPhotos[0];
        }


        home.save().then((result) => {
            console.log("Home updated successfully", result);
        });
        
    }) 
    res.redirect('/host/host-home');
};



exports.hosthome = (req, res, next) => {
  const userId = req.session.user._id;

  Home.find({ userId }) // Only homes created by the logged-in user
    .then(registerHouse => {
      res.render('host/host-home-list', {
        registerHouse,
        currentPage: 'host-home',
        isLoggedIn: req.isLoggedIn,
        user: req.session.user,
        userType: req.session.userType,
      });
    })
    .catch(err => {
      console.error("Error fetching homes:", err);
      res.status(500).send("Error fetching host homes");
    });
};




exports.postDeleteHome = (req, res, next) => {
    const homeId = req.params.homeId;
    console.log("homeId", homeId);
    const home = Home.findByIdAndDelete(homeId).then(() => {
        res.redirect('/host/host-home');
    }).catch(err => {
        console.error("Error deleting home:", err);

    });

}



