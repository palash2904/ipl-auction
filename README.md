# IPL Legends Auction

A complete Angular 20 multiplayer-ready IPL mega auction simulator with live bidding, franchise setup, purse management, overseas slot rules, squad limits, accelerated auction controls, re-auction support, persistence, and PDF-friendly squad export.

## Tech Stack

- Angular 20 standalone components
- TypeScript
- RxJS timer loop
- Signal-backed state service
- Responsive dark IPL auction room styling
- LocalStorage save/load persistence
- Optional Firebase Firestore realtime sync
- Optional Firebase AI Logic commentary
- Karma/Jasmine unit tests

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:4200/`.

If PowerShell blocks `npm`, use:

```bash
npm.cmd start
```

## Scripts

```bash
npm run build
npm.cmd test -- --watch=false --browsers=ChromeHeadlessNoGpu
```

The custom Karma launcher is included because some Windows headless Chrome installs need GPU-disabled flags.

## Firebase Setup

Firebase is enabled in `src/environments/environment.ts` and `src/environments/environment.prod.ts`.

For owner identity, enable **Authentication > Sign-in method > Anonymous** in Firebase Console. If anonymous auth is not enabled, the app still creates a local browser id, but authenticated security rules will need Auth enabled.

Suggested starter Firestore rule for private testing:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /auctionRooms/{roomId} {
      allow read, write: if true;
      match /members/{memberId} {
        allow read, write: if true;
      }
    }
  }
}
```

Tighten this before sharing publicly, ideally with Firebase Auth and owner-only bid validation.

## Project Structure

```text
src/app/
  core/
    guards/
    services/
  features/
    auction/
      data/
    dashboard/
    multiplayer/
    setup/
    summary/
  models/
  shared/
    pipes/
```

## Features

- Setup page for 2 to 8 franchises with duplicate owner/franchise validation
- Team-owner-only join screen
- Each team can be claimed by one connected owner
- Team owners can place bids only for their selected franchise
- Firestore-powered shared auction room when Firebase is enabled
- Exact IPL-style auction sets from marquee legends through hall of fame legends
- Live auction room with current player card, bid table, highest bidder flash, bid history, and commentary
- Bid increments:
  - Under Rs 2 Cr: Rs 0.25 Cr
  - Rs 2-5 Cr: Rs 0.50 Cr
  - Above Rs 5 Cr: Rs 1 Cr
  - Above Rs 15 Cr: Rs 2 Cr
- Rule enforcement for purse, overseas slots, squad size, and player status
- Manual Sold and Unsold controls for moving the auction forward
- Pause/resume, undo last bid, accelerated phase, re-auction phase
- AI live commentary through Firebase AI Logic, with local fallback
- Team dashboard with purse, squad, overseas usage, total spent, players table, and composition bars
- Auction summary with PDF export through browser print
- Sound cues for bids and sold events
- Local save/load auction state

## Tests

Coverage includes:

- Auction increment rules
- Franchise setup constraints
- Sale and purse updates
- Full-squad bid prevention
- Setup duplicate validation
- Root shell rendering
