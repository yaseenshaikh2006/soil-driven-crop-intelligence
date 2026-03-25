import io
import pandas as pd
from data_extractor import process_file, extract_from_text

def test_csv():
    df = pd.DataFrame([{
        "N": 100, "P": 45, "K": 40, "temperature": 25.5, 
        "humidity": 80.0, "ph": 6.5, "rainfall": 200.0
    }])
    csv_bytes = df.to_csv(index=False).encode('utf-8')
    
    class DummyFile:
        def __init__(self, filename, content):
            self.filename = filename
            self.content = content
        def read(self):
            return self.content
            
    print("CSV Test:", process_file(DummyFile("test.csv", csv_bytes)))

def test_text():
    text = '''
    Soil Analysis Report
    Nitrogen = 90
    Phosphorus: 42
    Potassium 43
    temp: 20.8
    humidity: 82.0
    ph: 6.5
    rainfall= 202.9
    '''
    print("Text Parse Test:", extract_from_text(text))

def test_table_text():
    text = '''
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
    '''
    print("Table Parse Test:", extract_from_text(text))

if __name__ == "__main__":
    test_csv()
    test_text()
    test_table_text()
