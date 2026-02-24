import pandas as pd
if __name__ == '__main__':
    df = pd.read_csv('dataset/crop_data.csv')
    counts = df['label'].value_counts()
    print(counts.to_dict())
