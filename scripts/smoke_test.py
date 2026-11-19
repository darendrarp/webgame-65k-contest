#!/usr/bin/env python3
"""Headless smoke test for STARSLING (Playwright + local static server).

Loads the game, clicks Play, performs a real drag-launch, and reports any
console/page errors. Screenshots go to screenshots/ (also used in README).

Usage: ~/workspace/airdrop-agent/.venv/bin/python scripts/smoke_test.py
"""
import http.server
import json
import socketserver
import threading
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME_DIR = ROOT / "game"
SHOTS = ROOT / "screenshots"


def serve():
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(GAME_DIR))
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def main():
    from playwright.sync_api import sync_playwright

    SHOTS.mkdir(exist_ok=True)
    httpd = serve()
    base = f"http://127.0.0.1:{httpd.server_address[1]}/"
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1100, "height": 760})
        page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.goto(base, wait_until="networkidle")
        page.wait_for_timeout(600)
        page.screenshot(path=str(SHOTS / "01-menu.png"))

        # Open How to play and back (screen switching).
        page.click("#btn-howto")
        page.wait_for_timeout(300)
        assert page.is_visible("#screen-howto"), "howto screen did not open"
        page.click("#btn-howto-back")
        page.wait_for_timeout(300)

        # Open level select, verify 12 cards, start level 1 from there.
        page.click("#btn-levels")
        page.wait_for_timeout(300)
        cards = page.query_selector_all(".level-card")
        assert len(cards) == 12, f"expected 12 level cards, got {len(cards)}"
        cards[0].click()
        page.wait_for_timeout(500)
        page.screenshot(path=str(SHOTS / "02-level1.png"))
        assert page.is_visible("#hud"), "HUD not visible in game"

        # Real drag-launch: pad is at world (90,270); drag down-left so the
        # ship flies up-right toward the first shard at (300,180).
        box = page.locator("#game-canvas").bounding_box()
        sx = box["width"] / 960
        sy = box["height"] / 540
        pad_x = box["x"] + 90 * sx
        pad_y = box["y"] + 270 * sy
        page.mouse.move(pad_x, pad_y)
        page.mouse.down()
        page.mouse.move(pad_x - 120 * sx, pad_y + 50 * sy, steps=12)
        page.wait_for_timeout(250)
        page.screenshot(path=str(SHOTS / "03-aiming.png"))
        page.mouse.up()
        page.wait_for_timeout(900)
        page.screenshot(path=str(SHOTS / "04-flight.png"))
        # Let the flight resolve, then check the HUD updated (score or launches).
        page.wait_for_timeout(2500)
        hud = {
            "level": page.inner_text("#hud-level"),
            "score": page.inner_text("#hud-score"),
            "launches": page.inner_text("#hud-launches"),
            "shards": page.inner_text("#hud-shards"),
        }
        page.screenshot(path=str(SHOTS / "05-after-flight.png"))
        browser.close()

    print("HUD after one launch:", json.dumps(hud))
    print("console/page errors:", len(errors))
    for e in errors:
        print("  -", e)
    print("screenshots:", sorted(str(p.name) for p in SHOTS.glob("*.png")))
    if errors:
        raise SystemExit(1)
    print("SMOKE TEST PASSED")


if __name__ == "__main__":
    main()
