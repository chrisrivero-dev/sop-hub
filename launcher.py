"""
launcher.py — SOP Hub Desktop Launcher

Entry point for the PyInstaller EXE.
Handles: port check, Flask startup, server polling, browser open.

app.py is unchanged by this file. It is imported as a module,
not run as __main__, so its __main__ block does not execute.
"""

import os
import sys
import time
import threading
import webbrowser
import urllib.request
import urllib.error

HOST = "127.0.0.1"
PORT = 5050
BASE_URL = f"http://{HOST}:{PORT}"
SEARCH_HUB_URL = f"{BASE_URL}/search-hub"

POLL_TIMEOUT_SECONDS = 20
POLL_INTERVAL_SECONDS = 0.25


# ======================================================
# DEBUG MODE
# ======================================================

def _is_debug_mode():
    """True if SOP_DEBUG=1 env var set or --debug passed as argument."""
    return os.environ.get("SOP_DEBUG") == "1" or "--debug" in sys.argv


# ======================================================
# SERVER PROBE
# ======================================================

def _server_is_running():
    """
    Return True if a server is already responding on PORT.
    HTTPError counts as running (server responded, just with an error code).
    URLError / OSError means nothing is listening.
    """
    try:
        urllib.request.urlopen(BASE_URL, timeout=1)
        return True
    except urllib.error.HTTPError:
        return True
    except Exception:
        return False


def _wait_for_server():
    """
    Poll BASE_URL until Flask responds or POLL_TIMEOUT_SECONDS elapses.
    Returns True if server became ready, False on timeout.
    """
    deadline = time.monotonic() + POLL_TIMEOUT_SECONDS

    while time.monotonic() < deadline:
        if _server_is_running():
            return True
        time.sleep(POLL_INTERVAL_SECONDS)

    return False


# ======================================================
# FLASK THREAD
# ======================================================

def _run_flask(debug):
    """Import and start the Flask app. Runs in a background thread."""
    from app import app

    app.run(
        host=HOST,
        port=PORT,
        debug=debug,
        use_reloader=False,
    )


# ======================================================
# MAIN
# ======================================================

def main():
    debug = _is_debug_mode()

    # If a server is already running on this port, open a browser tab and exit.
    # This prevents a second Flask instance from starting.
    if _server_is_running():
        webbrowser.open(SEARCH_HUB_URL)
        return

    # Start Flask in a background daemon thread.
    # daemon=True ensures the thread does not block process exit if Flask crashes.
    flask_thread = threading.Thread(
        target=_run_flask,
        args=(debug,),
        daemon=True,
        name="flask-server",
    )
    flask_thread.start()

    # Poll until Flask is ready, then open the browser once.
    ready = _wait_for_server()

    if ready:
        webbrowser.open(SEARCH_HUB_URL)
    else:
        print(
            f"[launcher] Flask did not respond within {POLL_TIMEOUT_SECONDS}s. "
            "The browser was not opened. Check that port {PORT} is not in use.",
            file=sys.stderr,
        )

    # Block the main thread until Flask exits.
    # This keeps the EXE process alive for the lifetime of the server.
    flask_thread.join()


if __name__ == "__main__":
    main()