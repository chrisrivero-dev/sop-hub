import os
from PIL import Image

# ======================================================
# SAFE TARGETED THUMBNAIL GENERATOR
# ======================================================

TARGET_FOLDERS = [
    r"Q:\WORD\id docs"
]

SUPPORTED_DOCS = [".doc", ".docx", ".xls", ".xlsx", ".pdf"]


def create_thumbnail(file_path):
    base, _ = os.path.splitext(file_path)
    thumb_path = base + ".png"

    # Safety: never overwrite existing previews
    if os.path.exists(thumb_path):
        print("Skipped existing:", thumb_path)
        return

    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", (600, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    text = os.path.basename(file_path)

    # Simple text preview (center-ish)
    draw.text((50, 100), text, fill=(0, 0, 0))

    img.save(thumb_path)

    print("Created:", thumb_path)


def run():
    for folder in TARGET_FOLDERS:
        if not os.path.exists(folder):
            print("Folder not found:", folder)
            continue

        for filename in os.listdir(folder):
            full_path = os.path.join(folder, filename)

            if not os.path.isfile(full_path):
                continue

            ext = os.path.splitext(filename)[1].lower()

            # 🚫 SKIP TEMP / LOCK FILES
            if filename.startswith("~$"):
                continue

            if ext in SUPPORTED_DOCS:
                create_thumbnail(full_path)


if __name__ == "__main__":
    run()