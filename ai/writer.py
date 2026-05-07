
def generate_sop(prompt, mode="search"):
    # Mock response logic
    if mode == "search":
        if "parcel" in prompt.lower() and "merge" in prompt.lower():
            return (
                "📄 Match Found: SOP – Parcel Merge – Type F (2024)\n"
                "• Tool: ATS\n• Category: Parcel Maps\n• Year: 2024\n"
                "• File: Q:/SOPs/Parcel_Merge_TypeF_2024.docx"
            )
        elif "lla" in prompt.lower():
            return (
                "📄 Match Found: SOP – LLA Process – Revised Steps (2023)\n"
                "• Tool: ArcGIS\n• Category: LLA\n• Year: 2023\n"
                "• File: Q:/SOPs/LLA/LLA_Process_Guide_2023.docx"
            )
        elif "type g" in prompt.lower():
            return (
                "📄 Match Found: SOP – Type G Street Easement (2022)\n"
                "• Tool: ATS\n• Category: Street Easements\n• Year: 2022\n"
                "• File: Q:/SOPs/Easements/Street_TypeG_2022.docx"
            )
        else:
            return "No exact SOP found. Try using keywords like 'parcel merge', 'LLA', or 'Type G'."
    elif mode == "draft":
        return (
            "SOP Title: [Drafted SOP Title Based on Prompt]\n\n"
            "PURPOSE:\nThis SOP outlines the required steps for ...\n\n"
            "PROCEDURE:\n1. Step one...\n2. Step two...\n3. Confirm results.\n\n"
            "TAGS: ATS, Parceling, Draft\nYear: 2025"
        )
    else:
        return "Invalid mode. Use 'search' or 'draft'."
