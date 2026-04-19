import pandas as pd
import pdfplumber
import pytesseract
from PIL import Image
import io
import re

def extract_from_text(text):
    """
    Extracts N, P, K, temperature, humidity, ph, rainfall from text using RegEx.
    """
    data = {}
    
    # Pre-process text to remove row numbers like "1 ", "1.", "1)" at the beginning of a line if followed by text
    text = re.sub(r'(?m)^\s*\d+[\s\.\)]+(?=[A-Za-z])', '', text)
    
    # 1. Strict Patterns: Require value to be on the same line as the parameter name
    strict_patterns = {
        'N': r'(?i)\b(?:nitrogen|\bavail(?:able)?\s*n\b|\bn\b|no3[\-\s]*n|nitrate)\b[^\d\n]{0,80}?(\d+(?:\.\d+)?)',
        'P': r'(?i)\b(?:phosphorus|\bavail(?:able)?\s*p\b|p2o5|p205|\bp\b|weak\s+bray)\b[^\d\n]{0,80}?(\d+(?:\.\d+)?)',
        'K': r'(?i)\b(?:potassium|\bavail(?:able)?\s*k\b|k2o|k20|\bk\b)\b[^\d\n]{0,80}?(\d+(?:\.\d+)?)',
        'temperature': r'(?i)\b(?:temperature|temp)\b[^\d\n]{0,80}?(\d+(?:\.\d+)?)',
        'humidity': r'(?i)\b(?:humidity|hum|rh)\b[^\d\n]{0,80}?(\d+(?:\.\d+)?)',
        'ph': r'(?i)\b(?:soil\s*ph|ph)\b(?!\s*[:.]?\s*\(?\d{3,})[^\d\n]{0,80}?(\d+(?:\.\d+)?)',
        'rainfall': r'(?i)\b(?:rainfall|rain)\b[^\d\n]{0,80}?(\d+(?:\.\d+)?)'
    }
    
    # 2. Vertical Patterns: Allow traversing newlines to find values
    vertical_patterns = {
        'N': r'(?i)\b(?:nitrogen|\bavail(?:able)?\s*n\b|\bn\b|no3[\-\s]*n|nitrate)\b[^\d]{0,80}?(\d+(?:\.\d+)?)',
        'P': r'(?i)\b(?:phosphorus|\bavail(?:able)?\s*p\b|p2o5|p205|\bp\b|weak\s+bray)\b[^\d]{0,80}?(\d+(?:\.\d+)?)',
        'K': r'(?i)\b(?:potassium|\bavail(?:able)?\s*k\b|k2o|k20|\bk\b)\b[^\d]{0,80}?(\d+(?:\.\d+)?)',
        'temperature': r'(?i)\b(?:temperature|temp)\b[^\d]{0,80}?(\d+(?:\.\d+)?)',
        'humidity': r'(?i)\b(?:humidity|hum|rh)\b[^\d]{0,80}?(\d+(?:\.\d+)?)',
        'ph': r'(?i)\b(?:soil\s*ph|ph)\b(?!\s*[:.]?\s*\(?\d{3,})[^\d]{0,80}?(\d+(?:\.\d+)?)',
        'rainfall': r'(?i)\b(?:rainfall|rain)\b[^\d]{0,80}?(\d+(?:\.\d+)?)'
    }

    for k in strict_patterns.keys():
        data[k] = None

    # Helper function to apply a dictionary of patterns
    def apply_patterns(patterns_dict):
        for key, pattern in patterns_dict.items():
            if data.get(key) is not None:
                continue
            
            matches = re.finditer(pattern, text)
            for m in matches:
                try:
                    val = float(m.group(1))
                    if key == 'ph':
                        if val == 1.0:
                            continue # skip false positive 1:1
                        if 14.0 < val <= 140.0:
                            val = val / 10.0
                        if 1.0 < val < 14.0:
                            data[key] = val
                            break
                    else:
                        if val > 0:
                            # Skip small integers likely to be row numbers in vertical mode
                            if val in [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0] and patterns_dict == vertical_patterns:
                                continue
                            data[key] = val
                            break
                except Exception:
                    continue

    apply_patterns(strict_patterns)
    apply_patterns(vertical_patterns)
    
    return data

def extract_from_csv(file_bytes):
    """
    Extracts the first row values for the required parameters from a CSV file.
    """
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
        # Ensure column names are lowercase and stripped of whitespaces
        df.columns = [str(c).lower().strip() for c in df.columns]
        
        mappings = {
            'N': ['n', 'nitrogen'],
            'P': ['p', 'phosphorus'],
            'K': ['k', 'potassium'],
            'temperature': ['temperature', 'temp'],
            'humidity': ['humidity'],
            'ph': ['ph'],
            'rainfall': ['rainfall']
        }
        
        data = {}
        for key, possible_names in mappings.items():
            found = False
            for val in possible_names:
                if val in df.columns:
                    val_data = df[val].iloc[0]
                    data[key] = float(val_data) if not pd.isna(val_data) else None
                    found = True
                    break
            if not found:
                data[key] = None
        return data
    except Exception as e:
        raise ValueError(f"Error parsing CSV: {e}")

def extract_from_pdf(file_bytes):
    """
    Extracts text from a PDF file and parses parameter values.
    """
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        return extract_from_text(text)
    except Exception as e:
        raise ValueError(f"Error parsing PDF: {e}")

def extract_from_image(file_bytes):
    """
    Extracts text from an image using OCR and parses parameter values.
    """
    try:
        image = Image.open(io.BytesIO(file_bytes))
        
        # Set Tesseract path explicitly for Windows if installed via standard installer
        import os
        
        # Check primary locations for Tesseract
        possible_paths = [
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
            r'C:\Users\shada\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                break
        
        text = pytesseract.image_to_string(image, config='--psm 6')
        
        # Log the extracted text so we can see what Tesseract is returning if it fails
        print("====== OCR Text ======")
        print(text)
        print("======================")
        
        return extract_from_text(text)
    except Exception as e:
        raise ValueError(f"Error parsing Image: {e}. Please ensure Tesseract OCR is installed on the system (C:\\Program Files\\Tesseract-OCR\\tesseract.exe).")

def process_file(file_storage):
    """
    Main entry point for processing an uploaded file, identifying format and processing accordingly.
    """
    filename = file_storage.filename.lower()
    file_bytes = file_storage.read()
    
    if filename.endswith('.csv'):
        return extract_from_csv(file_bytes)
    elif filename.endswith('.pdf'):
        return extract_from_pdf(file_bytes)
    elif filename.endswith('.png') or filename.endswith('.jpg') or filename.endswith('.jpeg'):
        return extract_from_image(file_bytes)
    else:
        raise ValueError("Unsupported file format. Please upload a CSV, PDF, or Image (.png, .jpg, .jpeg) file.")
