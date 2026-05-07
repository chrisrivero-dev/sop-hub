import os
import win32com.client

ROOT = r"Q:\WORD"

def convert_all_docs():
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False

    for folder, _, files in os.walk(ROOT):
        for f in files:
            if f.lower().endswith(".doc") and not f.lower().endswith(".docx"):
                doc_path = os.path.join(folder, f)
                docx_path = doc_path + "x"  # example: A.doc → A.docx

                if os.path.exists(docx_path):
                    continue

                try:
                    print("Converting:", doc_path)
                    doc = word.Documents.Open(doc_path)
                    doc.SaveAs(docx_path, FileFormat=16)
                    doc.Close()
                except Exception as e:
                    print("FAILED:", doc_path, e)

    word.Quit()

convert_all_docs()
