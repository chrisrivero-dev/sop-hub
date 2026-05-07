# splash.py - clean, single splash implementation

import tkinter as tk

_root = None
_label = None


def _center_window(root, width, height):
    root.update_idletasks()
    sw = root.winfo_screenwidth()
    sh = root.winfo_screenheight()
    x = (sw // 2) - (width // 2)
    y = (sh // 2) - (height // 2)
    root.geometry(f"{width}x{height}+{x}+{y}")


def show_splash():
    """
    Run a simple blocking splash window.
    This will be run in a background thread from app.py.
    """
    global _root, _label

    _root = tk.Tk()
    _root.title("OC SOP Hub")
    _root.resizable(False, False)
    _root.configure(bg="#f2f2f2")

    width, height = 420, 160
    _center_window(_root, width, height)

    _label = tk.Label(
        _root,
        text="Indexing files… Please wait",
        font=("Segoe UI", 13),
        bg="#f2f2f2",
        fg="#333333",
        wraplength=380,
        justify="center",
    )
    _label.pack(expand=True, padx=20, pady=20)

    _root.mainloop()


def close_splash(error_message=None):
    """
    If error_message is provided, show it for a few seconds,
    then close the splash. If no error, close immediately.
    """
    global _root, _label

    if _root is None:
        return

    try:
        if error_message:
            if _label is not None:
                _label.config(text="❌ " + str(error_message))
            # Keep window up for 4s so tech can read it
            _root.after(4000, _root.destroy)
        else:
            _root.after(100, _root.destroy)
    except Exception:
        # If anything goes wrong, just force close.
        try:
            _root.destroy()
        except Exception:
            pass
