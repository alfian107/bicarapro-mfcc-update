"""Generate BicaraPro microphone icon assets (white mic on teal gradient).

Outputs:
  icon.png          1024x1024  teal gradient bg + white mic (launcher icon)
  adaptive-icon.png 1024x1024  transparent bg + white mic in safe zone (Android)
  favicon.png       256x256    teal gradient bg + white mic
  splash-image.png  512x512    transparent bg + white mic (splash bg is teal)
  app-image.png     512x512    teal gradient bg + white mic (in-app logo)
"""
import math
from PIL import Image, ImageDraw

OUT = "/app/frontend/assets/images"

TOP = (20, 184, 166)     # #14B8A6
BOTTOM = (13, 100, 94)   # #0D645E (a touch darker than brandSecondary)
WHITE = (255, 255, 255, 255)


def gradient_bg(size, top, bottom):
    img = Image.new("RGB", (size, size), top)
    px = img.load()
    for y in range(size):
        t = y / max(size - 1, 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return img.convert("RGBA")


def draw_mic(size, color, scale=1.0, dy=0.0):
    """Draw a centered microphone on a transparent RGBA canvas.

    Rendered at 4x supersampling for smooth edges, then downscaled.
    scale ~ fraction of canvas the mic roughly occupies.
    """
    ss = 4
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    cx = S / 2
    cy = S / 2 + dy * S

    # Overall mic height reference
    unit = S * 0.62 * scale  # total mic height
    cap_w = unit * 0.40
    cap_h = unit * 0.58
    cap_top = cy - unit * 0.52
    cap_left = cx - cap_w / 2
    cap_right = cx + cap_w / 2
    cap_bottom = cap_top + cap_h
    radius = cap_w / 2

    stroke = max(int(unit * 0.055), 2)

    # Capsule (mic head)
    d.rounded_rectangle(
        [cap_left, cap_top, cap_right, cap_bottom],
        radius=radius, fill=color,
    )

    # U-bracket arc hugging the capsule
    arc_pad = unit * 0.16
    ax0 = cap_left - arc_pad
    ay0 = cap_top + cap_h * 0.28
    ax1 = cap_right + arc_pad
    ay1 = cap_bottom + arc_pad
    d.arc([ax0, ay0, ax1, ay1], start=20, end=160, fill=color, width=stroke)

    # Vertical stem
    arc_bottom_y = ay1
    stem_top = arc_bottom_y - stroke * 0.4
    stem_bottom = cy + unit * 0.44
    d.line([(cx, stem_top), (cx, stem_bottom)], fill=color, width=stroke)

    # Base
    base_w = unit * 0.34
    base_h = max(int(unit * 0.05), 2)
    d.rounded_rectangle(
        [cx - base_w / 2, stem_bottom - base_h / 2,
         cx + base_w / 2, stem_bottom + base_h / 2],
        radius=base_h / 2, fill=color,
    )

    return img.resize((size, size), Image.LANCZOS)


def compose_on_gradient(size, mic_scale=1.0):
    bg = gradient_bg(size, TOP, BOTTOM)
    mic = draw_mic(size, WHITE, scale=mic_scale)
    bg.alpha_composite(mic)
    return bg


def main():
    # Launcher icon (full-bleed teal + mic)
    compose_on_gradient(1024, mic_scale=1.0).save(f"{OUT}/icon.png")

    # Android adaptive foreground: transparent, mic within safe zone (~62%)
    draw_mic(1024, WHITE, scale=0.70).save(f"{OUT}/adaptive-icon.png")

    # Favicon
    compose_on_gradient(256, mic_scale=1.0).save(f"{OUT}/favicon.png")

    # Splash (bg is teal via config) -> transparent white mic
    draw_mic(512, WHITE, scale=1.0).save(f"{OUT}/splash-image.png")

    # In-app logo image
    compose_on_gradient(512, mic_scale=1.0).save(f"{OUT}/app-image.png")

    print("Icons generated OK")


if __name__ == "__main__":
    main()
