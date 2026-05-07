import os
import shutil


WORKSPACE_ROOT = r"Q:\Mapping Reference Workspace"
WORKSPACE_USER_FOLDER = "Christopher Rivero"
WORKSPACE_SUBFOLDER = "SOP Hub References"

ALLOWED_SOURCE_ROOTS = [
    r"Q:\WORD",
    r"Q:\Excel Files",
    r"Q:\Mapping Reference Workspace",
]


def _safe_folder_name(value):
    value = str(value or "Ungrouped").strip()

    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        value = value.replace(char, "-")

    return value or "Ungrouped"


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


def _get_workspace_base_folder():
    return os.path.join(
        WORKSPACE_ROOT,
        WORKSPACE_USER_FOLDER,
        WORKSPACE_SUBFOLDER,
    )


def _get_destination_folder(group_name):
    safe_group = _safe_folder_name(group_name)

    return os.path.join(
        _get_workspace_base_folder(),
        safe_group,
    )


def copy_reference_to_workspace(source_path, group_name="Ungrouped"):
    if not source_path:
        return {
            "success": False,
            "copied": False,
            "message": "Missing source path.",
        }

    source_path = os.path.normpath(source_path)

    if not os.path.exists(source_path):
        return {
            "success": False,
            "copied": False,
            "message": "Source file not found.",
            "source_path": source_path,
        }

    if not os.path.isfile(source_path):
        return {
            "success": False,
            "copied": False,
            "message": "Source path is not a file.",
            "source_path": source_path,
        }

    if not _is_allowed_source_path(source_path):
        return {
            "success": False,
            "copied": False,
            "message": "Source path is outside approved Mapping reference folders.",
            "source_path": source_path,
        }

    destination_folder = _get_destination_folder(group_name)
    os.makedirs(destination_folder, exist_ok=True)

    file_name = os.path.basename(source_path)
    destination_path = os.path.join(destination_folder, file_name)

    if _normalize_path(source_path) == _normalize_path(destination_path):
        return {
            "success": True,
            "copied": False,
            "message": "Source file is already in the workspace destination.",
            "source_path": source_path,
            "destination_path": destination_path,
        }

    if os.path.exists(destination_path):
        return {
            "success": True,
            "copied": False,
            "message": "File already exists in workspace. Existing copy was not overwritten.",
            "source_path": source_path,
            "destination_path": destination_path,
        }

    try:
        shutil.copy2(source_path, destination_path)
    except PermissionError:
        return {
            "success": False,
            "copied": False,
            "message": "File is currently open or locked. Close the file and try again.",
            "source_path": source_path,
            "destination_path": destination_path,
        }
    except OSError as e:
        return {
            "success": False,
            "copied": False,
            "message": f"Copy failed: {e}",
            "source_path": source_path,
            "destination_path": destination_path,
        }

    return {
        "success": True,
        "copied": True,
        "message": "File copied to workspace.",
        "source_path": source_path,
        "destination_path": destination_path,
    }