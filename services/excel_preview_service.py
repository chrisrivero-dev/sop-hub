import os
import pandas as pd


MAX_ROWS = 10
MAX_COLUMNS = 12

ALLOWED_SOURCE_ROOTS = [
    r"Q:\WORD",
    r"Q:\Excel Files",
    r"Q:\Mapping Reference Workspace",
]


def _normalize_path(path):
    return os.path.normcase(os.path.abspath(os.path.normpath(path)))


def _is_allowed_source_path(source_path):
    normalized_source = _normalize_path(source_path)

    for root in ALLOWED_SOURCE_ROOTS:
        normalized_root = _normalize_path(root)

        try:
            if os.path.commonpath([normalized_source, normalized_root]) == normalized_root:
                return True
        except ValueError:
            continue

    return False


def build_excel_preview(file_path):
    if not file_path:
        return {
            "success": False,
            "message": "Missing file path.",
        }

    file_path = os.path.normpath(file_path)

    if not os.path.exists(file_path):
        return {
            "success": False,
            "message": "Excel file not found.",
            "file_path": file_path,
        }

    if not os.path.isfile(file_path):
        return {
            "success": False,
            "message": "Path is not a file.",
            "file_path": file_path,
        }

    if not _is_allowed_source_path(file_path):
        return {
            "success": False,
            "message": "File is outside approved Mapping reference folders.",
            "file_path": file_path,
        }

    ext = os.path.splitext(file_path)[1].lower()

    if ext not in {".xls", ".xlsx"}:
        return {
            "success": False,
            "message": "File is not an Excel workbook.",
            "file_path": file_path,
        }

    try:
        excel_file = pd.ExcelFile(file_path)
        sheet_name = excel_file.sheet_names[0]

        df = pd.read_excel(
            file_path,
            sheet_name=sheet_name,
            nrows=MAX_ROWS,
            dtype=str,
        )

        df = df.fillna("")
        df = df.iloc[:, :MAX_COLUMNS]

        columns = [str(col) for col in df.columns]
        rows = df.values.tolist()

        return {
            "success": True,
            "file_path": file_path,
            "file_name": os.path.basename(file_path),
            "sheet_name": sheet_name,
            "columns": columns,
            "rows": rows,
            "row_count": len(rows),
            "column_count": len(columns),
        }

    except PermissionError:
        return {
            "success": False,
            "message": "Excel file is currently open or locked. Close the file and try again.",
            "file_path": file_path,
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"Could not preview Excel file: {e}",
            "file_path": file_path,
        }