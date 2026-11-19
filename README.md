# Pixel Shader Switches

- [Original pixel shader switches](https://bhu103-data.github.io/pixel-shader-switches/)
- [Pixel Atlas for New York, Alaska, and Las Vegas](https://bhu103-data.github.io/pixel-shader-switches/usa/)

## Original Shader Switches

Three interactive scenes explore pixel art, light, and tactile controls in a single HTML file.

The renderer reuses light-field and 2D fallback buffers, supports older Canvas implementations without `roundRect`, and keeps its controls responsive at narrow mobile viewport sizes.

- **Lujiazui Focus Switch** changes the lights and atmosphere of the Shanghai skyline.
- **Beijing Four Seasons Scroll** moves through seasonal variations of a Beijing panorama.
- **Light & Dark** switches between two lighting treatments with a shader effect.

Open [Shader Switches](https://bhu103-data.github.io/pixel-shader-switches/) or serve `index.html` from the repository root.

## Pixel Atlas

Pixel Atlas is an interactive pixel-art travel project built with JavaScript and HTML Canvas. Visitors can explore three animated panoramas, switch seasons, and scrub from sunrise to moonrise or let the skies change automatically. [Open the live demo](https://bhu103-data.github.io/pixel-shader-switches/usa/)

Animation scratch data is reused where practical, resize work is frame-throttled, and resuming the automatic cycle continues from the manually selected season and light state instead of jumping ahead.

- **New York** features the No. 7 train, the Statue of Liberty, and a scripted superhero encounter that plays forward and in reverse.
- **Alaska** features the northern lights, seasonal snowfall, wildlife, and fish jumping in a glacial fjord.
- **Las Vegas** features the Sphere, the High Roller boarding queue, fountains, and a 777 jackpot that sends pedestrians scrambling for cash before they leave in yellow cabs.

The full site is in `usa/`. Open `usa/index.html` to enter as a guest, then choose a panorama. The demo also includes fullscreen and pause controls.

The site has no build step. From the repository root, run `python3 -m http.server 8000` and open `http://localhost:8000/usa/`. GitHub Pages serves the atlas at `/usa/` when it publishes from the default branch root.

### Email and SMS verification

Without Supabase, the email sign-in demo checks the format of a sample address and opens the atlas. The form does not transmit the address or create an account. Guest access also works without Supabase.

1. Add your Supabase project URL and browser-safe publishable key (`sb_publishable_...`) to `usa/auth-config.js`. Keep private keys in your authentication service.
2. Enable the Email and Phone providers in Supabase Auth. Use `{{ .Token }}` in the email template to deliver a verification code. Set up an SMS provider for phone verification. Configure the production site URL and email sender, then test delivery.
3. Verify registration and sign-in with both email and phone. Registration can create an account. Sign-in only works with an existing account. Use **Account** in the scene to open the sign-out screen.
