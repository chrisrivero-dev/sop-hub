import os
import shutil
import tempfile
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

try:
    import win32com.client
except ImportError:
    win32com = None


# ======================================================
# SAFE SETTINGS
# ======================================================

TARGET_FOLDERS = [
    r"Q:\WORD\id docs",
    r"Q:\Excel Files\2027 Cut Sheets",
    r"Q:\Excel Files\Condos\Bk419",
    r"Q:\Excel Files\Special Services\RDA Yearly Update Files\RDA - Yearly Exemption Reports\2016-17",
]

SUPPORTED_FILES = {
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".png",
    ".jpg",
    ".jpeg",
}

SKIP_PREFIXES = ("~$",)
OVERWRITE_EXISTING = False
MAX_FILES = 50  # targeted folders only; safe enough for this test


# ======================================================
# HELPERS
# ======================================================

def should_skip(file_path):
    name = os.path.basename(file_path)

    if name.startswith(SKIP_PREFIXES):
        return True

    ext = os.path.splitext(name)[1].lower()

    if ext not in SUPPORTED_FILES:
        return True

    # Do not create previews for preview images
    if ext in {".png", ".jpg", ".jpeg"}:
        return True

    return False


def preview_path_for(file_path):
    base, _ = os.path.splitext(file_path)
    return base + ".png"


def render_pdf_first_page_to_png(pdf_path, output_png):
    doc = fitz.open(pdf_path)

    if doc.page_count == 0:
        doc.close()
        raise ValueError("PDF has no pages")

    page = doc.load_page(0)
    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    pix.save(output_png)

    doc.close()


def convert_word_to_pdf(file_path, temp_dir):
    if win32com is None:
        raise RuntimeError("pywin32 is not installed")

    output_pdf = os.path.join(temp_dir, Path(file_path).stem + ".pdf")

    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False

    try:
        doc = word.Documents.Open(file_path, ReadOnly=True)
        doc.ExportAsFixedFormat(output_pdf, 17)  # 17 = PDF
        doc.Close(False)
    finally:
        word.Quit()

    return output_pdf


def convert_excel_to_pdf(file_path, temp_dir):
    if win32com is None:
        raise RuntimeError("pywin32 is not installed")

    output_pdf = os.path.join(temp_dir, Path(file_path).stem + ".pdf")

    excel = win32com.client.DispatchEx("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False

    try:
        workbook = excel.Workbooks.Open(file_path, ReadOnly=True)
        workbook.ExportAsFixedFormat(0, output_pdf)  # 0 = PDF
        workbook.Close(False)
    finally:
        excel.Quit()

    return output_pdf


def convert_powerpoint_to_pdf(file_path, temp_dir):
    if win32com is None:
        raise RuntimeError("pywin32 is not installed")

    output_pdf = os.path.join(temp_dir, Path(file_path).stem + ".pdf")

    powerpoint = win32com.client.DispatchEx("PowerPoint.Application")

    try:
        presentation = powerpoint.Presentations.Open(file_path, WithWindow=False)
        presentation.SaveAs(output_pdf, 32)  # 32 = PDF
        presentation.Close()
    finally:
        powerpoint.Quit()

    return output_pdf


def create_real_preview(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    output_png = preview_path_for(file_path)

    if os.path.exists(output_png) and not OVERWRITE_EXISTING:
        print("SKIPPED existing:", output_png)
        return

    with tempfile.TemporaryDirectory() as temp_dir:
        if ext == ".pdf":
            render_pdf_first_page_to_png(file_path, output_png)

        elif ext in {".doc", ".docx"}:
            pdf_path = convert_word_to_pdf(file_path, temp_dir)
            render_pdf_first_page_to_png(pdf_path, output_png)

        elif ext in {".xls", ".xlsx"}:
            pdf_path = convert_excel_to_pdf(file_path, temp_dir)
            render_pdf_first_page_to_png(pdf_path, output_png)

        elif ext in {".ppt", ".pptx"}:
            pdf_path = convert_powerpoint_to_pdf(file_path, temp_dir)
            render_pdf_first_page_to_png(pdf_path, output_png)

        else:
            raise ValueError(f"Unsupported file type: {ext}")

    print("CREATED:", output_png)


def run():
    processed = 0

    for folder in TARGET_FOLDERS:
        if not os.path.exists(folder):
            print("Folder not found:", folder)
            continue

        for filename in os.listdir(folder):
            file_path = os.path.join(folder, filename)

            if not os.path.isfile(file_path):
                continue

            if should_skip(file_path):
                continue

            try:
                create_real_preview(file_path)
                processed += 1
            except Exception as err:
                print("FAILED:", file_path)
                print("ERROR:", err)

            if processed >= MAX_FILES:
                print("STOPPED at MAX_FILES safety limit:", MAX_FILES)
                return


if __name__ == "__main__":
    run()