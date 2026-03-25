import json
from data_extractor import extract_from_text

def test_regex():
    texts = [
        "Nitrogen (mg/kg) 49",
        "NITRATE-N (FIA) 49",
        "Nitrogen (ppm) : 49.5",
        "PHOSPHORUS P1 (WEAK BRAY) 1:7 58",
        "POTASSIUM 320 VH",
        "pH 5.7",
        "SOIL pH BUFFER INDEX 1:1 5.7 6.6",
        "Soil pH 59",
        "Nitrogen         ( ppm )\n\n    49",
        "NITRATE-N (FIA)\nSURFACE SUBSOIL\nppm lbs/A\n49 88"
    ]
    with open("out.txt", "w", encoding="utf-8") as f:
        for text in texts:
            f.write(f"Testing: '{text}'\n")
            res = extract_from_text(text)
            f.write(json.dumps(res, indent=2) + "\n")
            f.write("-" * 40 + "\n")

if __name__ == "__main__":
    test_regex()
