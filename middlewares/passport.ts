import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User";
import dotenv from "dotenv";
import { environment } from "../env/environment";

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: environment.googleClientID,
            clientSecret: environment.googleClientSecret,
            callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ provider: "google", providerId: profile.id });

                if (!user) {
                    user = await User.create({
                        name: profile.displayName || profile.name?.givenName || "Unknown",
                        email: profile.emails?.[0]?.value || null,
                        provider: "google",
                        providerId: profile.id,
                    });
                }

                return done(null, user);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
