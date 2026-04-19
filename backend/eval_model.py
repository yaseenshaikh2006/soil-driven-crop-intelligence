import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pickle

data = pd.read_csv("../dataset/crop_data.csv")
X = data[['N','P','K','temperature','humidity','ph','rainfall']]
y = data['label']

with open("crop_model.pkl", "rb") as f:
    best_model, le = pickle.load(f)

y_encoded = le.transform(y)

X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)

y_pred = best_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy on Test Set: {accuracy * 100:.2f}%")
print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=le.classes_))
