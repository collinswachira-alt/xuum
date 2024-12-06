// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { UnverifiedUser, User } = require('../models/User');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const temporaryPasswords = {};

require('dotenv').config();

const router = express.Router();

const app = express();
app.use(bodyParser.json());
app.use(express.json());


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  // logger: true, // Enable logging
  // debug: true, // Enable debug output
});


// Function to generate referral code with format XUMMER-12345-B
function generateReferralCode() {
  const randomNumber = Math.floor(Math.random() * 100000);
  const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Random letter (A-Z)
  return `XUMMER-${randomNumber}-${randomLetter}`;
}

// Register Use
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, referralCode } = req.body;


    // Check if email exists in UnverifiedUser or User collection
    const existingUnverified = await UnverifiedUser.findOne({ email });
    const existingUser = await User.findOne({ email });

    if (existingUnverified || existingUser) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Handle referral code
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id; // Set the referrer's ObjectId
      } else {
        return res.status(400).json({ message: 'Invalid referral code.' });
      }
    }

    // Generate new referral code for the user
    const newReferralCode = `XUMMER-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;


    // Save to UnverifiedUser collection
    const unverifiedUser = new UnverifiedUser({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      verificationCode,
      referralCode: newReferralCode,
      referredBy,
    });

    await unverifiedUser.save();

    // Send the verification email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: 'Verify Your Account',
      text: `
        Hello ${unverifiedUser.firstName} ${unverifiedUser.lastName}!
        Your account has been created successfully. Your verification code is: ${verificationCode}.
        Kindly VERIFY your account within 1 hour to prevent losing your progress.

        Note: Do NOT share your verification code with anyone.

        Kindly ignore if you do not recognize this event.

        Regards,
        XUUM team.`,
    });

    res.status(201).json({ message: 'Registration successful. Check your email for the verification code.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



// Verify Email
router.post('/verify', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    const unverifiedUser = await UnverifiedUser.findOne({ email });

    if (!unverifiedUser) {
      return res.status(404).json({ message: 'User not found or already verified.' });
    }

    if (unverifiedUser.verificationCode !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    // Create new verified user
    const newUser = new User({
      firstName: unverifiedUser.firstName,
      lastName: unverifiedUser.lastName,
      email: unverifiedUser.email,
      password: unverifiedUser.password,
      referralCode: unverifiedUser.referralCode,
      referredBy: unverifiedUser.referredBy,
    });
    await newUser.save();

    // Remove from unverified users
    await UnverifiedUser.deleteOne({ email });

    // Handle referrals
      if (unverifiedUser.referredBy) {
        const referrer = await User.findById(unverifiedUser.referredBy);
    
        if (referrer) {
          referrer.referrals += 1;
          await referrer.save();
    
          await transporter.sendMail({
            from: process.env.EMAIL,
            to: referrer.email,
            subject: 'Successful Referral',
            text: `
            Congratulations (${referrer.firstName})! 
            The user you referred (${unverifiedUser.firstName} ${unverifiedUser.lastName}) has successfully verified their account.
            Your XUM tokens are underway.
            You now have a total of ${referrer.referrals} referrals.

            Kindly ignore if you do not recognise this event.

            Regards,
            XUUM team`,
          });
        }
      }   
    

    // Send verification success email to the new user
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: 'Verification Successful',
      text: `
      Congratulations, ${unverifiedUser.firstName}! 
      Your email has been successfully verified, and your account is now active. 
      Invite Friends and Family using your unique XUM code ${unverifiedUser.referralCode} to get declared rewards.
      You can also use your XUM code or your email to Login your account.

      Kindly ignore if you do not recognise this event.

      Regards,
      XUUM team `,
    });

    res.status(200).json({ message: 'Account verified successfully.', user: newUser });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: 'It is not YOU, it is US..', error: err.message });
  }
});
router.put('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body; // Dynamic updates from request body

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates }, // Use $set to update specific fields
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'User updated successfully.', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email exists in the User collection
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Compare provided password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET, // Secret key from .env file
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Send the token and user information in the response
    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        referralCode: user.referralCode
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// Request password reset
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate a random temporary password (6 characters long for example)
    const tempPassword = crypto.randomBytes(3).toString('hex');  // Generates a random 6-character string
    temporaryPasswords[email] = tempPassword;

    // Send email with the temporary password
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: 'Password Reset Request',
      text: `
        Hello ${user.firstName} ${user.lastName},

        We have received a request to reset your password. Please use the following temporary password to reset 
        your password:
        
        Temporary Password: ${tempPassword}

        Kindly use this password on the password reset form to set a new password.

        Note: This is a temporary password and will expire after a short time.

        If you did not request this, please ignore this email.

        Regards,
        XUUM team.`,
    });

    res.status(200).json({ message: 'A temporary password has been sent to your email.' });
  } catch (err) {
    console.error('Error sending reset email:', err);
    res.status(500).json({ message: 'Error sending reset email.' });
  }
});



// Verify and reset password

router.post('/reset-password', async (req, res) => {
  try {
    const { email, tempPassword, newPassword } = req.body;

    // Check for missing fields
    if (!email || !tempPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }


    // Fetch the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Validate tempPassword (assuming you saved it temporarily in memory or cache)
    if (temporaryPasswords[email] !== tempPassword) {
      return res.status(400).json({ message: 'Invalid temporary password.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

        // Send an email to the user confirming the password reset
        await transporter.sendMail({
          from: process.env.EMAIL,  
          to: user.email,  
          subject: 'Password Reset Successful',
          text: `
            Hello ${user.firstName} ${user.lastName},
            
            Your password has been successfully reset. 
            Kindly use yor new password to Login.

            If you did not initiate this change, please contact support immediately.
            
            Regards,
            XUUM Team
          `,
        });


    return res.status(200).json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
});


module.exports = router;
