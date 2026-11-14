# Star Tables ⭐

A small static web app that helps children master their addition, subtraction
and times tables.

There are three subjects. Adding and subtracting go up to the 10s (ten tables
of ten facts each), and multiplying goes up to the 12s (twelve tables of twelve):

| Subject      | Tables     | The 7 table                                                     |
| ------------ | ---------- | --------------------------------------------------------------- |
| ➕ Add       | +1 to +10  | 7 + 1 = 8 … 7 + 10 = 17                                         |
| ➖ Subtract  | −1 to −10  | 8 − 7 = 1 … 17 − 7 = 10 (addition backwards, so never negative) |
| ✖️ Multiply  | ×1 to ×12  | 7 × 1 = 7 … 7 × 12 = 84                                         |

Each table has three levels, and each level earns one star:

| Star | Level        | What the child does               | To earn the star                                   |
| ---- | ------------ | --------------------------------- | -------------------------------------------------- |
| 1    | 🌱 Learn     | Taps the right answer out of four | No more than 2 wrong (8 of 10, or 10 of 12)        |
| 2    | 💪 Practice  | Types the answer on a number pad  | No more than 1 wrong (9 of 10, or 11 of 12)        |
| 3    | ⚡ Master    | Types the answer against a clock  | All right at 5 seconds a fact (50 or 60 seconds)   |

A fact answered wrong shows the right answer, then comes back later in the
round for another try. Three stars on every table of a subject (30 stars for
adding or subtracting, 36 for multiplying) makes an **Addition**,
**Subtraction** or **Multiplication Master**, which is the app's way of saying
the child probably doesn't need it for that subject any more. All 96 stars
means they don't need the app at all.

Each player has a named profile with their own stars, and the app remembers
which subject each player was working on. Everything is saved in
the browser's `localStorage` on that device. There are no accounts and no
server, and nothing leaves the device.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build and host it

```bash
npm run build    # writes the finished site to out/
```

`out/` is plain HTML, CSS and JavaScript. Upload it to any static host
(Netlify, Cloudflare Pages, GitHub Pages, S3, a school web server). To try the
built site locally:

```bash
npx serve out
```

The site expects to live at the root of its domain. To host it under a
sub-path such as `example.com/tables/`, set `basePath: "/tables"` in
`next.config.ts` and update the paths in `public/manifest.webmanifest`.

## On iPhone and iPad

Open the site in Safari, tap Share, then "Add to Home Screen". It then opens
full screen like an app, and works well with Guided Access to keep a child in
it. To feel like an app rather than a web page, it cannot be pinch-zoomed or
double-tap zoomed, does not bounce when scrolled past its ends, and a long
press does not select text or open link previews. These are set in
`app/layout.tsx` (viewport), `app/globals.css` (base styles) and
`components/AppFeel.tsx`.

## Where things are

| Path                       | What it holds                                             |
| -------------------------- | --------------------------------------------------------- |
| `lib/game.ts`              | The subjects, the levels and their pass marks, and question generation |
| `lib/round.ts`             | The rules of one round (answering, retries, the clock)    |
| `lib/store.ts`             | Profiles and progress in `localStorage`                   |
| `lib/sound.ts`             | Sound effects, synthesised in the browser (no audio files) |
| `lib/confetti.ts`          | Confetti and fireworks                                    |
| `components/`              | The screens: profiles, table grid, table page, game       |
| `app/`                     | Routes: `/`, `/play/add/7/`, `/play/add/7/2/`             |

To change how far a subject goes, edit its `tables` and `facts` in
`lib/game.ts`. To make the levels easier or harder, change each level's
`misses` and the shared `SECONDS_PER_FACT` in the same file.
