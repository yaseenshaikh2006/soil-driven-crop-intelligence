import re

def test_regex():
    text = """
    SOIL ANALYSIS REPORT
    PHOSPHORUS
    P1 P2
    ppm ppm
    58 VH 78 VH
    POTASSIUM MAGNESIUM CALCIUM
    K Mg Ca
    ppm RATE ppm RATE ppm RATE
    320 VH 327 VH 2383 M
    pH
    SOIL pH BUFFER INDEX
    1:1
    5.7 6.6
    NITRATE-N (FIA)
    SURFACE SUBSOIL
    ppm lbs/A
    49 88
    """
    
    strict_patterns = {
        'N': r'(?i)\b(?:n|nitrogen)\b\s*[:=\-]?\s*(\d+(?:\.\d+)?)',
        'P': r'(?i)\b(?:p|phosphorus)\b\s*[:=\-]?\s*(\d+(?:\.\d+)?)',
        'K': r'(?i)\b(?:k|potassium)\b\s*[:=\-]?\s*(\d+(?:\.\d+)?)',
        'ph': r'(?i)\b(?:ph|soil\s*ph)\b\s*[:=\-]?\s*(\d+(?:\.\d+)?)',
    }
    
    loose_patterns = {
        'N': r'(?i)\b(?:nitrate-n|nitrogen)\b(?:[\s\S]{0,80}?)\b(\d+(?:\.\d+)?)\b',
        'P': r'(?i)\b(?:phosphorus|p1|p2|weak bray)\b(?:[\s\S]{0,80}?)\b(\d+(?:\.\d+)?)\b',
        'K': r'(?i)\b(?:potassium)\b(?:[\s\S]{0,80}?)\b(\d+(?:\.\d+)?)\b',
        'ph': r'(?i)\b(?:soil\s*ph|ph)\b(?:[\s\S]{0,80}?)\b(\d+(?:\.\d+)?)\b'
    }
    
    data = {}
    for key in strict_patterns:
        match = re.search(strict_patterns[key], text)
        if match:
            val = float(match.group(1))
            if key == 'ph' and val == 1.0:
                pass # skip false positive 1:1
            else:
                data[key] = val
                continue
                
        if key in loose_patterns:
            # We want to find the first reasonable match in the loose pattern
            # For pH, anything between 0 and 14 is reasonable
            # For N, P, K, usually higher.
            matches = re.finditer(loose_patterns[key], text)
            found = False
            for m in matches:
                val = float(m.group(1))
                if key == 'ph':
                    if 1.0 < val < 14.0:
                        data[key] = val
                        found = True
                        break
                else:
                    if val > 1.0: # skip potential 1:1 or other random low numbers
                        data[key] = val
                        found = True
                        break
            if found:
                continue
                
        data[key] = None
    
    print("Extracted Data:", data)

if __name__ == "__main__":
    test_regex()
