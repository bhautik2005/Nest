 const User = require('../modals/user')
 const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');
  // Adjust path as needed


 //============---SART OF FORGET&REST PASSWORD---========////
 //=======================================================//
 

// Configure nodemailer (update with your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// GET /forgot-password - Render forgot password form
exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password',
    errorMessage: null,
    successMessage: null
  });
};

// POST /forgot-password - Handle forgot password request
exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.render('auth/forgot-password', {
        title: 'Forgot Password',
        errorMessage: 'Please provide an email address',
        successMessage: null
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.render('auth/forgot-password', {
        title: 'Forgot Password',
        errorMessage: null,
        successMessage: 'If an account with that email exists, you will receive a password reset link shortly.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name || 'User'},</p>
          <p>You requested a password reset for your account. Click the link below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <div>
           ${resetUrl}
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>Your App Team</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.render('auth/forgot-password', {
      title: 'Forgot Password',
      errorMessage: null,
      successMessage: 'Password reset link has been sent to your email address.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.render('auth/forgot-password', {
      title: 'Forgot Password',
      errorMessage: 'An error occurred. Please try again later.',
      successMessage: null
    });
  }
};

 
// GET /reset-password/:token - Debug version
exports.getResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('=== RESET PASSWORD DEBUG ===');
    console.log('Token from URL:', token);
    console.log('Token length:', token ? token.length : 'undefined');
    console.log('Current time:', new Date());
    
    // Basic token validation
    if (!token || token.length !== 64) {
      console.log('❌ Token validation failed - invalid format');
      return res.render('auth/error', {
        title: 'Invalid Token',
        message: 'Password reset token is invalid or has expired.',
        backLink: '/auth/forgot-password'
      });
    }

    // Find user with valid reset token
    console.log('🔍 Searching for user with token...');
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('✅ User email:', user.email);
      console.log('✅ Token expiry:', new Date(user.resetTokenExpiry));
      console.log('✅ Token valid:', user.resetTokenExpiry > Date.now());
    } else {
      // Let's check if user exists with this token but expired
      const expiredUser = await User.findOne({ resetToken: token });
      if (expiredUser) {
        console.log('❌ Token found but expired');
        console.log('❌ User email:', expiredUser.email);
        console.log('❌ Token expiry:', new Date(expiredUser.resetTokenExpiry));
        console.log('❌ Current time:', new Date());
      } else {
        console.log('❌ No user found with this token');
        // Check if any users have reset tokens
        const usersWithTokens = await User.find({ resetToken: { $exists: true } });
        console.log('📊 Users with reset tokens:', usersWithTokens.length);
      }
    }

    if (!user) {
      return res.render('auth/error', {
        title: 'Invalid Token',
        message: 'Password reset token is invalid or has expired.',
        backLink: '/auth/forgot-password'
      });
    }

    console.log('✅ Rendering reset password form');
    res.render('auth/reset-password', {
      title: 'Reset Password',
      token: token,
      errorMessage: null,
      successMessage: null
    });

  } catch (error) {
    console.error('❌ Reset password GET error:', error);
    res.render('auth/error', {
      title: 'Error',
      message: 'An error occurred. Please try again later.',
      backLink: '/auth/forgot-password'
    });
  }
};

// Debug version of forgot password POST
// POST /reset-password/:token - Handle password reset
exports.postResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    console.log('=== RESET PASSWORD POST DEBUG ===');
    console.log('Token from URL:', token);
    console.log('Request body:', req.body);
    console.log('Password provided:', password ? 'Yes' : 'No');
    console.log('Confirm password provided:', confirmPassword ? 'Yes' : 'No');

    // Validate passwords
    if (!password || !confirmPassword) {
      console.log('❌ Password validation failed - missing fields');
      return res.render('auth/reset-password', {
        title: 'Reset Password',
        token: token,
        errorMessage: 'Please provide both password and confirm password.',
        successMessage: null
      });
    }

    if (password !== confirmPassword) {
      console.log('❌ Password validation failed - passwords do not match');
      return res.render('auth/reset-password', {
        title: 'Reset Password',
        token: token,
        errorMessage: 'Passwords do not match.',
        successMessage: null
      });
    }

    if (password.length < 6) {
      console.log('❌ Password validation failed - too short');
      return res.render('auth/reset-password', {
        title: 'Reset Password',
        token: token,
        errorMessage: 'Password must be at least 6 characters long.',
        successMessage: null
      });
    }

    // Basic token validation
    if (!token || token.length !== 64) {
      console.log('❌ Token validation failed - invalid format');
      return res.render('auth/error', {
        title: 'Invalid Token',
        message: 'Password reset token is invalid or has expired.',
        backLink: '/auth/forgot-password'
      });
    }

    // Find user with valid reset token
    console.log('🔍 Searching for user with token...');
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('✅ User email:', user.email);
      console.log('✅ Token expiry:', new Date(user.resetTokenExpiry));
    }

    if (!user) {
      console.log('❌ No valid user found with token');
      return res.render('auth/error', {
        title: 'Invalid Token',
        message: 'Password reset token is invalid or has expired.',
        backLink: '/auth/forgot-password'
      });
    }

    // Hash new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    console.log('💾 Updating user password and clearing token...');
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    console.log('✅ Password updated successfully');

    // Send confirmation email (optional - you can skip this for now)
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset Successful',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Successful</h2>
            <p>Hello ${user.name || 'User'},</p>
            <p>Your password has been successfully reset.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            <p>Best regards,<br>Your App Team</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Confirmation email sent');
    } catch (emailError) {
      console.log('⚠️ Email sending failed:', emailError.message);
      // Don't fail the password reset if email fails
    }

    console.log('✅ Redirecting to login page');
    res.render('auth/login', {
       oldInput:"",
      title: 'Login',
      errorMessage: null,
      successMessage: 'Password reset successful! You can now login with your new password.'
    });

  } catch (error) {
    console.error('❌ Reset password POST error:', error);
    res.render('auth/reset-password', {
      title: 'Reset Password',
      token: req.params.token,
      errorMessage: 'An error occurred. Please try again later.',
      successMessage: null
    });
  }
};




// Test function to check database state
const debugDatabaseState = async (req, res) => {
  try {
    console.log('=== DATABASE DEBUG ===');
    
    // Check all users with reset tokens
    const usersWithTokens = await User.find({ 
      resetToken: { $exists: true, $ne: null } 
    });
    
    console.log('Users with reset tokens:', usersWithTokens.length);
    
    usersWithTokens.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log('Email:', user.email);
      console.log('Token:', user.resetToken);
      console.log('Token Length:', user.resetToken ? user.resetToken.length : 'N/A');
      console.log('Expiry:', user.resetTokenExpiry);
      console.log('Expiry Date:', new Date(user.resetTokenExpiry));
      console.log('Current Time:', new Date());
      console.log('Is Expired:', user.resetTokenExpiry <= Date.now());
      console.log('Time until expiry (minutes):', (user.resetTokenExpiry - Date.now()) / (1000 * 60));
    });
    
    // Check specific user
    const specificUser = await User.findOne({ email: 'gondaliyabhautik419@gmail.com' });
    if (specificUser) {
      console.log('\n=== SPECIFIC USER DEBUG ===');
      console.log('Email:', specificUser.email);
      console.log('Has resetToken:', !!specificUser.resetToken);
      console.log('resetToken:', specificUser.resetToken);
      console.log('resetTokenExpiry:', specificUser.resetTokenExpiry);
      console.log('Expiry Date:', specificUser.resetTokenExpiry ? new Date(specificUser.resetTokenExpiry) : 'N/A');
    }
    
    res.json({ message: 'Debug complete, check console' });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
};

 
     
 //============---END OF FORGET&REST PASSWORD---========////
 //=======================================================//
 





exports.getLogin = (req, res, next) => {

  res.render('auth/login', {
    currentPage: 'login',
    isLoggedIn: false,
    errors: [],
    oldInput: { email: "" },
    user: {},

  })
}

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    console.log("Email not found:", email);
    return res.status(422).render('auth/login', {
      currentPage: "login",
      isLoggedIn: false,
      errorMessages: ['User does not exist'],
      oldInput: { email },
      user: {},
    });
  }


   // Add this for debugging:
  // console.log("Entered password:", password);
  // console.log("Stored hash:", user.password);

  const isMatch = await bcrypt.compare(password, user.password);


  if (!isMatch) {
    // console.log("Password mismatch for email:", email);
    return res.status(422).render('auth/login', {
      currentPage: "login",
      isLoggedIn: false,
      errorMessages: ['Invalid password'],
      oldInput: { email },
      user: {},
    });
  }


  req.session.isLoggedIn = true;
  req.session.user = user;
  await req.session.save(err => {
    if (err) console.error("Session save error:", err);
  });
  res.redirect('/');
  //  console.log("user",req.session.user)
  //   console.log("userType",req.session.userType)
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

exports.getsingup = (req, res, next) => {
  res.render('auth/singup', {
    isLoggedIn: false,
    currentPage: 'singup',
    oldInput: {},
    user: {},
  })
}


exports.postsingup = [
   check("firstName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First Name should be atleast 2 characters long")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("First Name should contain only alphabets"),

  check("lastName")
    .matches(/^[A-Za-z\s]*$/)
    .withMessage("Last Name should contain only alphabets"),

  check("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  check("password")
    .isLength({ min: 8 })
    .withMessage("Password should be atleast 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password should contain atleast one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password should contain atleast one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password should contain atleast one number")
    .matches(/[!@&]/)
    .withMessage("Password should contain atleast one special character")
    .trim(),

  check("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  check("userType")
    .notEmpty()
    .withMessage("Please select a user type")
    .isIn(['guest', 'host'])
    .withMessage("Invalid user type"),

  check("terms")
    .notEmpty()
    .withMessage("Please accept the terms and conditions")
    .custom((value, { req }) => {
      if (value !== "on") {
        throw new Error("Please accept the terms and conditions");
      }
      return true;
    }),

  (req, res, next) => {

    const { firstName, lastName, email, password, userType } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render('auth/singup', {
        isLoggedIn: false,
        currentPage: 'singup',
        errorMessages: errors.array().map(error => error.msg),
        oldInput: {
          firstName,
          lastName,
          email,
          userType
        },
        user: {},
      });
    }



    bcrypt.hash(password, 12).then(hashPassword => {
      const user = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashPassword,
        userType
      });
      return user.save();
    }).then(() => {
      res.redirect('/login');
    }).catch(err => {
      return res.status(422).render("auth/signup", {
        pageTitle: "Signup",
        currentPage: "signup",
        isLoggedIn: false,
        errors: [err.message],
        oldInput: { firstName, lastName, email, userType },
        user: {},
      });
    });

  }
]

