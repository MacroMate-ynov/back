import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User";
import { environment } from "../env/environment";

passport.use(
    new GoogleStrategy(
        {
            clientID: environment.googleClientID,
            clientSecret: environment.googleClientSecret,
            callbackURL: `${environment.baseUrl}/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const { id: providerId, displayName: name, emails } = profile;
                const email = emails?.[0]?.value;

                if (!email) {
                    return done(new Error("No email found in profile"));
                }

                // Recherche de l'utilisateur par email
                let user = await User.findOne({ email });

                if (!user) {
                    // Si l'utilisateur n'existe pas, on le crée
                    user = await User.create({
                        name: name || "Unknown",
                        email,
                        provider: "google",
                        providerId,
                    });
                    console.log("User created", user);
                }

                return done(null, user); // L'utilisateur est authentifié
            } catch (err) {
                return done(err, false); // En cas d'erreur, renvoie un échec
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user.id); // Sérialisation de l'utilisateur en session
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user); // Désérialisation de l'utilisateur à partir de l'ID
    } catch (err) {
        done(err, null); // En cas d'erreur, renvoie null
    }
});

export default passport;
