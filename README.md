# Wrestling Fantasy — Public Demo

Sample data only. Branding, scoring, wheel config, roster pool and portraits are saved in the browser (localStorage).

## Demo flow (for Jeff Jarrett pitch)
1. Enter **`commish`** → set league name, colors, logo, scoring, wheel, pool.
2. Rename teams under **Teams & Invites** and copy the PINs.
3. Share owner PINs (`alpha`, `bravo`, …) so teammates can join and claim waivers / draft.

## PIN rules
5–10 letters or numbers only (no spaces or special characters). Case-insensitive.

## Demo PINs
- `commish` — Commissioner (League Setup + Scoring editor + Wheel + Teams/Invites)
- `alpha` / `bravo` / `charlie` / `delta` / `echo` / `foxtrot` — team owners

## Features ready for demo
- League setup (name, divisions, colors, league logo)
- Calendar (Weekly TV / Special / PPV-PLE / Foreign Object / Draft; day + date)
- 6-month season (start/end, then redraft)
- Per-team logos (owner controlled)
- Editable scoring (Load AEW preset or custom TV/PPV rows)
- Wheel / FO module (toggle + editable segments; “Add an Extra Roster Spot”)
- Coin Flip for waiver wire tiebreakers (on by default)
- Foreign Objects list for last-place help (on by default)
- Roster pool + image-pack matching (filename → wrestler)
- Large portraits on My Team, waivers, draft board
- Draft setup (date/time, Snake or Auction; salary cap + min bid)
- Snake draft room + demo Auction (nominate / bid / award)
- Score entry with +/- deltas on standings

### Image guidelines
| Use | Recommended size | Format | Max file size |
|-----|------------------|--------|---------------|
| **League logo** | 512×512 (square) or 800×400 (wide) | PNG / WebP | ~1 MB |
| **Team logos** | 256×256 square | PNG / WebP | ~500 KB |
| **Wrestler portraits** | 256–512 px | PNG / WebP | ~600 KB |

## Safe to share
No real Season 9 data or Supabase keys.
