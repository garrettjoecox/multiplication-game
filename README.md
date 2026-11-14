# Star Tables ⭐

A small static web app that helps children master their times tables, 1 to 12.

Each table has three levels, and each level earns one star:

| Star | Level        | What the child does              | To earn the star             |
| ---- | ------------ | -------------------------------- | ---------------------------- |
| 1    | 🌱 Learn     | Taps the right answer out of four | 10 of 12 right first try     |
| 2    | 💪 Practice  | Types the answer on a number pad  | 11 of 12 right first try     |
| 3    | ⚡ Master    | Types the answer against a clock  | All 12 right in 60 seconds   |

A fact answered wrong shows the right answer, then comes back later in the
round for another try. Three stars on all twelve tables (36 stars) makes a
**Multiplication Master**, which is the app's way of saying the child probably
doesn't need it any more.

Each player has a named profile with their own stars. Everything is saved in
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

## Where things are

| Path                       | What it holds                                             |
| -------------------------- | --------------------------------------------------------- |
| `lib/game.ts`              | The levels and their pass marks, and question generation  |
| `lib/round.ts`             | The rules of one round (answering, retries, the clock)    |
| `lib/store.ts`             | Profiles and progress in `localStorage`                   |
| `lib/sound.ts`             | Sound effects, synthesised in the browser (no audio files) |
| `lib/confetti.ts`          | Confetti and fireworks                                    |
| `components/`              | The screens: profiles, table grid, table page, game       |
| `app/`                     | Routes: `/`, `/table/7/`, `/table/7/2/`                   |

To make the levels easier or harder, change `goal` and `timeLimitMs` in
`lib/game.ts`.
