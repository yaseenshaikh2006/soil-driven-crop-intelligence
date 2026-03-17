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
    
    strict_patterns = {
        'N': r'(?i)\b(?:n|nitrogen)\b\s*[:=\-]?\s*(\d+(?:\.\d+)?)',
        'P': r'(?i)\b(?:p|phosphorus)\b\s*[:=\-]?\s*(\d+(?:\.\d+)?)',
        'K': r'(?i)\b(?:k|potassium)\b\s*[:=\-]?\s*(\d+(?:\.\d+)?)',
        'temperature': r'(?i)\b(?:temperature|temp)\b\s*[:=\-]?\s*(\d+(?:\.\d+)?)',
        'humidity': r'(?i)\b(?:humidity)\b\s*[:=\-]?\s*(\d+(?:\.\d+)?)',
        'ph': r'(?i)\b(?:ph|soil\s*ph)\b\s*[:=\-]?\s*(\d+(?:\.\d+)?)',
        'rainfall': r'(?i)\b(?:rainfall)\b\s*[:=\-]?\s*(\d+(?:\.\d+)?)'
    }
    
    loose_patterns = {
        'N': r'nitrate[\s\-]*n|nitrogen',
        'P': r'phosphorus|\bp1\b|\bp2\b|weak\s+bray',
        'K': r'potassium',
        'temperature': r'temperature|temp',
        'humidity': r'humidity',
        'ph': r'soil\s*ph|\bph\b',
        'rainfall': r'rainfall'
    }
    
    for key in strict_patterns:
        match = re.search(strict_patterns[key], text)
        if match:
            val = float(match.group(1))
            if key == 'ph':
                if val == 1.0:
                    pass # skip false positive 1:1 ratio
                else:
                    if 14.0 < val < 140.0:
                        val = val / 10.0
                    data[key] = val
                    continue
            else:
                data[key] = val
                continue
                
        if key in loose_patterns:
            # Find the keyword match first
            keyword_match = re.search(r'(?i)\b(?:' + loose_patterns[key] + r')\b', text)
            if keyword_match:
                # Extract the next 450 characters after the keyword
                start_idx = keyword_match.end()
                chunk = text[start_idx:start_idx+450]
                
                # Scrub known measurement ratios and noise from the chunk so we don't extract them by accident
                noise_patterns = r'(?i)(?:1\s*:\s*[17]|0\s*-\s*6|100g|meq|ppm|lbs/a|mg/kg|cm|\b1:1\b|\bp1\b|\bp2\b)'
                clean_chunk = re.sub(noise_patterns, ' ', chunk)
                
                # Find all numbers within this clean chunk
                number_matches = re.finditer(r'\b(\d+(?:\.\d+)?)\b', clean_chunk)
                
                found = False
                for m in number_matches:
                    val = float(m.group(1))
                    if key == 'ph':
                        if 14.0 < val < 140.0:
                            val = val / 10.0
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
