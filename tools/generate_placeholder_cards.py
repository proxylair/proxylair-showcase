"""Generates clearly-placeholder card-art SVGs for the showcase gallery
until Joshua curates real cards via HIRO's "Publish to Showcase" step
(ADR-014 2.3). Every title/game here is fictional -- never reproduces a
real TCG card -- so there is zero compliance ambiguity about what's
shown before curation happens. Pure stdlib, no dependencies.

Run: python tools/generate_placeholder_cards.py
"""
import os

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cards")

# (id, title, game, style, accent)
CARDS = [
    ("ashfall-sentinel", "Ashfall Sentinel", "Fantasy TCG", "Cinematic · Ember foil", "#00e5ff"),
    ("wraithbloom", "Wraithbloom", "Fantasy TCG", "Ethereal · Violet gloss", "#ff3d9a"),
    ("stormcallers-oath", "Stormcaller's Oath", "Sci-fi TCG", "Dynamic · Amber finish", "#ffb84d"),
    ("verdant-hex", "Verdant Hex", "Fantasy TCG", "Organic · Emerald sheen", "#2dffb3"),
]

CARD_W, CARD_H = 500, 700  # ~5:7, standard TCG card proportion


def _art_svg(title, accent):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{CARD_W}" height="{CARD_H}" viewBox="0 0 {CARD_W} {CARD_H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a131a"/>
      <stop offset="55%" stop-color="{accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#05080b"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="60%">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="{accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="{CARD_W}" height="{CARD_H}" fill="url(#bg)"/>
  <rect width="{CARD_W}" height="{CARD_H}" fill="url(#glow)"/>
  <g opacity="0.5" stroke="{accent}" stroke-width="1.5">
    <line x1="0" y1="230" x2="{CARD_W}" y2="120"/>
    <line x1="0" y1="470" x2="{CARD_W}" y2="580"/>
    <circle cx="{CARD_W/2}" cy="{CARD_H*0.4}" r="150" fill="none" opacity="0.4"/>
  </g>
  <text x="50%" y="92%" text-anchor="middle" font-family="SFMono-Regular, Consolas, monospace"
        font-size="22" fill="{accent}" opacity="0.85" letter-spacing="2">SAMPLE ART · PLACEHOLDER</text>
  <text x="50%" y="50%" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="34" font-weight="700" fill="#e8f6fb">{title}</text>
</svg>"""


def _print_svg(title, accent):
    inset = 26
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{CARD_W}" height="{CARD_H}" viewBox="0 0 {CARD_W} {CARD_H}">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f1c26"/>
      <stop offset="100%" stop-color="#0a131a"/>
    </linearGradient>
  </defs>
  <rect width="{CARD_W}" height="{CARD_H}" fill="#020304"/>
  <rect x="{inset}" y="{inset}" width="{CARD_W - inset*2}" height="{CARD_H - inset*2}"
        rx="18" fill="url(#bg2)" stroke="{accent}" stroke-width="3"/>
  <rect x="{inset+16}" y="{inset+16}" width="{CARD_W - (inset+16)*2}" height="{CARD_H - (inset+16)*2}"
        rx="10" fill="none" stroke="{accent}" stroke-width="1" opacity="0.5"/>
  <text x="50%" y="14%" text-anchor="middle" font-family="SFMono-Regular, Consolas, monospace"
        font-size="16" fill="{accent}" letter-spacing="3" opacity="0.85">PROXYLAIR · PRINT PROOF</text>
  <text x="50%" y="50%" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif"
        font-size="30" font-weight="700" fill="#e8f6fb">{title}</text>
  <text x="50%" y="88%" text-anchor="middle" font-family="SFMono-Regular, Consolas, monospace"
        font-size="14" fill="#6f96a6" letter-spacing="1">Printed · Laminated · Cut · Sleeved</text>
</svg>"""


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for card_id, title, _game, _style, accent in CARDS:
        with open(os.path.join(OUT_DIR, f"{card_id}.svg"), "w", encoding="utf-8") as f:
            f.write(_art_svg(title, accent))
        with open(os.path.join(OUT_DIR, f"{card_id}-print.svg"), "w", encoding="utf-8") as f:
            f.write(_print_svg(title, accent))
    print(f"Wrote {len(CARDS) * 2} placeholder SVGs to {OUT_DIR}")


if __name__ == "__main__":
    main()
