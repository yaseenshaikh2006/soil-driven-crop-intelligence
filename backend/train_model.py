import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import pickle

# Load dataset
data = pd.read_csv("../dataset/crop_data.csv")

# Input & Output
X = data[['N','P','K','temperature','humidity','ph','rainfall']]
y = data['label']   # some datasets use 'label' instead of 'crop'

# Encode crop names
le = LabelEncoder()
y = le.fit_transform(y)

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Save model
with open("crop_model.pkl", "wb") as f:
    pickle.dump((model, le), f)

print("Model trained and saved!")
