from PIL import Image, ImageDraw

NAVY = (0, 46, 93, 255)
BLUE = (0, 162, 232, 255)
WHITE = (255, 255, 255, 255)


def draw_icon(size: int, path: str):
    img = Image.new("RGBA", (size, size), WHITE)
    d = ImageDraw.Draw(img)

    s = size / 100.0
    cx, cy = size / 2, size / 2

    # outer dashed ring (approximated as solid ring)
    d.ellipse([cx - 34 * s, cy - 34 * s, cx + 34 * s, cy + 34 * s], outline=NAVY, width=int(5 * s))
    # inner ring
    d.ellipse([cx - 26 * s, cy - 26 * s, cx + 26 * s, cy + 26 * s], outline=NAVY, width=int(3 * s))

    # car body shape
    body = [
        (30 * s, 58 * s),
        (35 * s, 58 * s),
        (37 * s, 55 * s),
        (41 * s, 50 * s),
        (45 * s, 45 * s),
        (52 * s, 41 * s),
        (62 * s, 41 * s),
        (71 * s, 41 * s),
        (76 * s, 45 * s),
        (80 * s, 52 * s),
        (81 * s, 54 * s),
        (80 * s, 58 * s),
        (72 * s, 58 * s),
    ]
    d.polygon(body, fill=NAVY)

    # windows
    d.ellipse([cx - 13 * s, cy - 7 * s, cx + 4 * s, cy + 7 * s], fill=WHITE)
    d.ellipse([cx + 6 * s, cy - 7 * s, cx + 23 * s, cy + 7 * s], fill=WHITE)

    # wheels
    d.ellipse([cx - 20 * s, cy + 2 * s, cx - 10 * s, cy + 12 * s], outline=NAVY, width=int(4 * s))
    d.ellipse([cx + 10 * s, cy + 2 * s, cx + 20 * s, cy + 12 * s], outline=NAVY, width=int(4 * s))

    img.save(path)
    print(f"saved {path}")


for sz in (192, 512):
    draw_icon(sz, f"public/icons/icon-{sz}.png")