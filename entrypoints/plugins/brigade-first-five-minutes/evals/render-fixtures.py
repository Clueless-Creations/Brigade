"""Render original synthetic screens from cases.json. Uses the existing Pillow package."""

import json
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
CASES = json.loads((ROOT / "cases.json").read_text())["cases"]
OUT = ROOT / "fixtures"
OUT.mkdir(exist_ok=True)


def font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


for case in CASES:
    for frame in case["frames"]:
        canvas = Image.new("RGB", (390, 844), "#F6F3EC")
        draw = ImageDraw.Draw(canvas)
        draw.rounded_rectangle((16, 20, 374, 824), radius=24, fill="#FFFFFF", outline="#D4D7CF")
        draw.text((32, 40), "9:41", font=font(14), fill="#18362F")
        draw.text((32, 82), case["app"], font=font(16), fill="#527365")
        y = 132
        for line in textwrap.wrap(frame["title"], width=24):
            draw.text((32, y), line, font=font(25), fill="#173C36")
            y += 32
        y += 16
        body_size = 28 if frame.get("largeText") else 18
        for paragraph in frame["body"]:
            for line in textwrap.wrap(paragraph, width=34):
                draw.text((32, y), line, font=font(body_size), fill="#2D332F")
                y += body_size + 9
            y += 10
        if frame["action"]:
            button_y = 800 if frame.get("clipAction") else 714
            draw.rounded_rectangle((32, button_y, 358, button_y + 54), radius=12, fill="#173C36")
            draw.text((48, button_y + 16), frame["action"], font=font(17), fill="#FFFFFF")
        if frame.get("secondary"):
            draw.text((32, 780), frame["secondary"], font=font(16), fill="#173C36")
        if frame.get("clipAction"):
            draw.rectangle((16, 818, 374, 843), fill="#DADDD7")
        if frame.get("cropped"):
            canvas = canvas.crop((16, 105, 374, 480))
        # This label is part of the supplied raw capture, not a judgment or expected answer.
        ImageDraw.Draw(canvas).text((20, 7), f"Synthetic fixture | {frame['id']}", font=font(11), fill="#6E756F")
        canvas.save(OUT / f"{frame['id']}.png", optimize=False)

print(f"Rendered {sum(len(c['frames']) for c in CASES)} synthetic captures.")
