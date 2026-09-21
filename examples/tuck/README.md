# Tuck · Leave with everything.

An offline iPhone packing planner and responsive web experience. Plan a trip,
choose what to bring, and pack by tapping an item or dropping it into the bag.
The same original illustrations, type, and colors carry through both surfaces.

## The web experience

The landing page puts a working packing table beside the product promise.

![Tuck desktop landing with an interactive packing table and illustrated weekend bag.](showcase/landing-desktop.jpg)

| A clear first step | A bag you can pack in the browser |
| --- | --- |
| <img src="showcase/landing-mobile.jpg" alt="Mobile landing: Leave with everything and Pack a weekend bag." width="320"> | <img src="showcase/landing-packing.jpg" alt="Mobile packing table with one shirt packed and five things remaining." width="320"> |

## The iPhone app

The bag appears in the first-use screen and stays within reach while packing.
An illustrated grid and a compact list support the same task.

| Start a trip | Pack your things | Use a checklist |
| --- | --- | --- |
| <img src="showcase/native-home.png" alt="Tuck first-use screen with illustrated bag and Plan a trip button." width="260"> | <img src="showcase/native-packing.png" alt="Lisbon weekend packing grid with quantities, filters, and a persistent bag." width="260"> | <img src="showcase/native-list.png" alt="The same trip in list mode with checkboxes and item editing." width="260"> |

These are original browser and iOS simulator screenshots from September 4, 2026.
They show the visual work delivered in those runs. Native screenshots precede
later accessibility repairs. The [capture manifest](showcase/manifest.json)
records the original filenames, dimensions, and SHA-256 hashes. No source
fingerprint was retained for these captures, so they do not certify the current
build or satisfy the independent design acceptance gate.

## Product Profile walkthrough

Tuck is also the smallest end-to-end example of Brigade's product-context loop. The important distinction is between **accepted intent** and **demonstrated behavior**.

1. `product.yaml` and `DESIGN.md` remain the accepted product/design owners.
2. Generate the intended projection with `b2c profile-refresh --workspace examples/tuck --json`.
3. Query only the context needed for a task with `b2c profile-query --workspace examples/tuck --query "<question>"`. The query returns a bounded, revision-bound projection rather than loading every source document.
4. Runtime evidence can be projected into an observed Product Profile only when evidence has actually been supplied. The screenshots above are historical captures with the limitations stated in their manifest; this walkthrough does **not** promote them into current-build proof.
5. An intended/observed delta is deterministic evidence for review. Missing observation stays unresolved rather than becoming a fabricated failure.
6. If a review accepts a product or design change, write that decision back to the existing canonical owner and refresh the intended profile. The profile never becomes a second requirements store.

Reference products use the same `product-profile/v1` core in `observed-reference` mode. Reference composition is proposal-only: a candidate mechanic can be marked adopt, adapt, reject, or unresolved with source-profile IDs and target constraints, but it cannot write Tuck's product truth. This keeps “learn from another product” separate from “copy another product.”

The Product Profile contract and synthetic conformance fixtures live under [`contracts/product-profile/`](../../contracts/product-profile/) and [`docs/contracts/product-profile/`](../../docs/contracts/product-profile/).

## Explore the implementation

- [Product contract](product.yaml) and [rendered product scope](PRODUCT.md): the promise, journeys, and accepted requirements.
- [Design system](DESIGN.md): shared identity, platform decisions, and screen contracts.
- [Native app](native/README.md): SwiftUI implementation, persistence, recovery, and simulator commands.
- [Web implementation](landing/): responsive page with local storage, editing, import, export, and undo.
- [Shared artwork](shared/object-geometry.json): original vector paths used by both implementations.
- [Behavior checks](tests/README.md) and [verification requirements](VERIFICATION.md): recorded observations and the evidence still needed.

To try the web experience, serve this directory from the repository root:

```sh
python3 -m http.server 4179 --bind 127.0.0.1 --directory examples/tuck
```

Open [the local packing page](http://127.0.0.1:4179/landing/). The browser stores
its bag on this local origin. Native build and test instructions are in the
[native guide](native/README.md).

Tuck demonstrates product and design execution for an offline utility. Its
accepted scope excludes purchases and subscriptions. Full design acceptance,
physical-device VoiceOver evidence, store distribution, and business results
remain unproven; this example does not establish whole-business completion.
