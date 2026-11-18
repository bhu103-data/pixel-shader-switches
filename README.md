# Pixel Shader Switches

- [Original pixel shader switches](https://bhu103-data.github.io/pixel-shader-switches/)
- [Pixel Atlas for New York, Alaska, and Las Vegas](https://bhu103-data.github.io/pixel-shader-switches/usa/)

## Pixel Atlas

Open `usa/index.html` to sign in or continue as a guest. `usa/scene.html` contains the fullscreen panoramas. Explore the No. 7 train, the Statue of Liberty, and the Elementals in New York, then switch to Alaska for wildlife, the northern lights, and snowfall. Fish leap from the water in both scenes. Las Vegas adds the Strip, the Sphere, the High Roller, and choreographed fountains.

The site has no build step. From the repository root, run `python3 -m http.server 8000` and open `http://localhost:8000/usa/`. GitHub Pages serves the atlas at `/usa/` when it publishes from the default branch root.

### Email and SMS verification

Supabase Auth powers the optional accounts. Guest access works without Supabase.

1. Add your Supabase project URL and browser-safe publishable key (`sb_publishable_...`) to `usa/auth-config.js`. Keep private keys in your authentication service.
2. Enable the Email and Phone providers in Supabase Auth. Use `{{ .Token }}` in the email template to deliver a verification code. Set up an SMS provider for phone verification. Configure the production site URL and email sender, then test delivery.
3. Verify registration and sign-in with both email and phone. Registration can create an account. Sign-in only works with an existing account. Use **Account** in the scene to open the sign-out screen.
