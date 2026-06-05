"""
Shared Q-drive pending question queue.

Technician submissions are written to a shared JSON file so admins on any
workstation can see them regardless of which local sop.db they have.

The queue file location is controlled by the SOP_SHARED_DATA_DIR env var.
Falls back to ./shared_data/ relative to the running process for local dev.
"""

import json
import os
import tempfile
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path


# ── PATH HELPERS ──────────────────────────────────────────────────────────────

def _get_shared_dir() -> Path:
    env = os.environ.get("SOP_SHARED_DATA_DIR", "").strip()
    if env:
        return Path(env)
    return Path(__file__).parent.parent / "shared_data"


def _queue_file() -> Path:
    return _get_shared_dir() / "pending_questions.json"


def _lock_file() -> Path:
    return _get_shared_dir() / "pending_questions.lock"


# ── FILE LOCKING ──────────────────────────────────────────────────────────────

_LOCK_TIMEOUT  = 5.0   # seconds to wait before giving up
_LOCK_STALE    = 30.0  # seconds before a lock is considered stale
_LOCK_POLL     = 0.05  # polling interval


def _acquire_lock(lock_path: Path, timeout: float = _LOCK_TIMEOUT) -> int:
    """Return an open fd for the lock file, or raise RuntimeError on timeout."""
    deadline = time.monotonic() + timeout
    while True:
        try:
            fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            # Write creation timestamp so we can detect stale locks
            try:
                os.write(fd, str(time.time()).encode())
            except OSError:
                pass
            return fd
        except FileExistsError:
            # Check for stale lock
            try:
                mtime = lock_path.stat().st_mtime
                if time.time() - mtime > _LOCK_STALE:
                    try:
                        lock_path.unlink()
                    except OSError:
                        pass
                    continue
            except OSError:
                pass
            if time.monotonic() >= deadline:
                raise RuntimeError(
                    "Could not acquire queue lock — another process may be stuck. "
                    "Please try again in a moment."
                )
            time.sleep(_LOCK_POLL)


def _release_lock(fd: int, lock_path: Path) -> None:
    try:
        os.close(fd)
    except OSError:
        pass
    try:
        lock_path.unlink()
    except OSError:
        pass


# ── ATOMIC WRITE ──────────────────────────────────────────────────────────────

def _atomic_write(path: Path, data: list) -> None:
    """Write data to path atomically via a temp file in the same directory."""
    parent = path.parent
    fd, tmp = tempfile.mkstemp(dir=str(parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, str(path))
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


# ── READ QUEUE ────────────────────────────────────────────────────────────────

def _read_queue(queue_path: Path) -> list:
    """Return the queue list; returns [] on any read/parse error."""
    try:
        with open(str(queue_path), "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return []


# ── PUBLIC API ────────────────────────────────────────────────────────────────

def submit_pending_question(data: dict) -> dict:
    """
    Validate and append a technician question to the shared queue.

    Returns the saved entry dict.
    Raises ValueError for bad input.
    Raises RuntimeError if the queue is unavailable (caller returns 503).
    """
    title = (data.get("title") or "").strip()
    if not title:
        raise ValueError("Question title is required.")

    notes        = (data.get("notes") or "").strip()
    submitted_by = (data.get("submitted_by") or "").strip()

    shared_dir = _get_shared_dir()
    try:
        shared_dir.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise RuntimeError(f"Shared data directory is not accessible: {exc}") from exc

    queue_path = _queue_file()
    lock_path  = _lock_file()

    fd = _acquire_lock(lock_path)
    try:
        queue = _read_queue(queue_path)
        entry = {
            "id":           str(uuid.uuid4()),
            "title":        title,
            "notes":        notes,
            "submitted_by": submitted_by,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "status":       "pending",
            "processed_by": None,
            "processed_at": None,
        }
        queue.append(entry)
        _atomic_write(queue_path, queue)
    finally:
        _release_lock(fd, lock_path)

    return entry


_ACTIVE_STATUSES = {"pending", "needs_review"}


def get_pending_questions(include_processed: bool = False) -> list:
    """
    Return active pending questions from the shared queue.

    Active means status in {pending, needs_review}.
    Processed/dismissed/archived records are excluded unless
    include_processed=True is passed explicitly.

    Never raises — returns [] if the queue file is missing or unreadable.
    Sorted newest-first.
    """
    queue = _read_queue(_queue_file())
    if not include_processed:
        queue = [q for q in queue if q.get("status") in _ACTIVE_STATUSES]
    queue.sort(key=lambda q: q.get("submitted_at") or "", reverse=True)
    return queue


def mark_processed(question_id: str, processed_by: str = None) -> bool:
    """
    Mark a pending question as processed.

    Returns True on success, False if the entry was not found.
    Raises RuntimeError if the queue cannot be locked.
    """
    queue_path = _queue_file()
    lock_path  = _lock_file()

    fd = _acquire_lock(lock_path)
    try:
        queue = _read_queue(queue_path)
        found = False
        for entry in queue:
            if entry.get("id") == question_id:
                entry["status"]       = "processed"
                entry["processed_by"] = processed_by or None
                entry["processed_at"] = datetime.now(timezone.utc).isoformat()
                found = True
                break
        if found:
            _atomic_write(queue_path, queue)
    finally:
        _release_lock(fd, lock_path)

    return found
