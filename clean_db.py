from app import app, db, Reference

with app.app_context():
    print("🔥 Cleaning duplicates…")
    seen = set()

    for ref in Reference.query.all():
        fp = ref.file_path.lower()

        if fp in seen:
            print("Deleting duplicate:", ref.file_path)
            db.session.delete(ref)
        else:
            seen.add(fp)

    db.session.commit()
    print("✅ Done.")
