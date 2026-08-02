# Sparks 🅿️
### Sony carpark sharing — quick, simple, live

Sparks lets our team share allocated car parks for the day when they're not needed, instead of sitting empty. If you're not driving in, someone else can borrow your spot — and you get it back automatically overnight.

This doc is a quick intro for anyone using the app, plus a separate section for whoever's managing it.

---

## Getting started

1. Open the Sparks link (bookmark it, or add it to your home screen — you'll be prompted to install it as an app on your phone).
2. First time only: pick your name from the list.
3. Tell it how you're using Sparks today:
   - **"I have an allocated park"** — you own a park and want to manage it
   - **"I need a park"** — you're looking to borrow one
4. That's it — Sparks remembers you after that. You won't need to set up again on that device.

---

## If you own a park

Each morning, tell Sparks whether your park is up for grabs:

- **Available** — you're not driving in; your park can be borrowed for the day
- **I'm using it** — you're parked there; it's off-limits

If someone wants to borrow your park, you'll get a notification with **Accept** / **Reject** buttons right there — no need to open the app. Tapping the notification itself will open Sparks instead, if you'd rather look first.

**Important:** turn on notifications when prompted — that's how requests reach you. Without it, you'll only see incoming requests if you happen to have the app open at the time.

Once someone's borrowed your park, it's theirs until *they* release it (or you release it yourself — see below). You'll get your park back automatically at midnight regardless, in case anyone forgets.

### Releasing a park you're not using

If you change your mind and need your own park back before someone releases it, or want to force it back to "available", just come back and update your status — Sparks will always let you reclaim your own park.

---

## If you need a park

1. Look at the map — green spots are up for grabs.
2. Tap one and confirm the request. If you're grabbing it for a visitor, you can add their name so the owner knows who to expect.
3. You'll see it listed as **"Waiting for approval"** — you can cancel it any time from there if you change your mind.
4. Once the owner responds, it'll either show as **"Yours until you release"** (approved) or let you know it was declined so you can try another.
5. **You can request more than one park at once** — say, one for yourself and one for a visitor. Each shows up separately in your list with its own Cancel/Release button.
6. Leaving for the day? Come back and hit **Release** on any park you're holding — that frees it up for the next person, rather than waiting until it resets overnight.

---

## Notifications

Sparks uses push notifications so owners hear about requests immediately, even with the app closed. A couple of notes:

- You'll be asked to allow notifications once, when you first set up as a park owner. Please say yes — this is the whole point of the app working smoothly.
- On Android, if notifications ever seem to stop arriving, check **Settings → Apps → Chrome → Battery → Unrestricted** — some phones aggressively restrict background apps by default.
- On iPhone, notifications need iOS 16.4 or later, and only work if you've added Sparks to your Home Screen (not just visiting it in Safari).

---

# For the admin

There's a hidden admin panel for full override control — useful for blocking off a park for maintenance, handing a park to a visitor directly without going through the request/approve flow, or clearing a stuck request.

### Unlocking it

Tap the **Sparks logo or title** 5 times quickly (within about 2 seconds). You'll be asked for a PIN.

> **Default PIN: `2468`**
> This lives in the app's own code, so treat it as a light deterrent rather than a real lock — anyone with access to the source could find it. That's an acceptable tradeoff for an internal tool like this, but if you ever want it changed, just ask.

Once entered correctly, admin mode **stays unlocked on that device** — you won't need to re-enter the PIN each time, even after closing the app or restarting your phone. Tapping the logo 5 times again will just reopen the panel directly.

To turn it off on a shared or public device, open the panel and tap **"Exit admin mode on this device"** at the bottom — this clears it and requires the PIN again next time.

### What you can do

For every park, you get three actions:

| Action | What it does |
|---|---|
| **Disable / Enable** | Marks a park unavailable (e.g. for maintenance) or brings it back — independent of who normally owns it |
| **Allocate** | Assigns a park straight to a visitor by name, bypassing the usual request/approve flow entirely |
| **Clear** | Force-releases a park regardless of its current state — useful if a request gets stuck or someone forgets to release |

Changes apply immediately and are visible to everyone using the app.

---

## Known limitations

- This is a lightweight internal tool, not a secured enterprise system — the database is openly writable by design to keep things simple, so please don't rely on it for anything beyond casual day-to-day carpark sharing.
- Notifications on iPhone are less reliable than Android, due to Apple's own restrictions on web push — this isn't something we can fully fix on our end.

---

Questions or something not working as expected? Flag it and it can usually be sorted out quickly — the app's still actively maintained.
