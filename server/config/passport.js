const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5001}`}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        const googleName = profile.displayName;
        const googlePic = profile.photos?.[0]?.value;
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: googleName,
            email: profile.emails?.[0]?.value,
            profilePic: googlePic,
          });
        } else {
          // Always sync name/profilePic from Google so old accounts get filled in
          const patch = {};
          if (!user.name && googleName) patch.name = googleName;
          if (!user.profilePic && googlePic) patch.profilePic = googlePic;
          if (Object.keys(patch).length) {
            await User.findByIdAndUpdate(user._id, patch);
            Object.assign(user, patch);
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
