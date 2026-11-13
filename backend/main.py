
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from pydantic import BaseModel, Field
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException


# --------------------------------------------------
# 1. Initialize FastAPI application
# --------------------------------------------------

app = FastAPI(
    title="California House Price Prediction API",
    description="Predict house prices using a Random Forest model",
    version="1.0.0"
)


# --------------------------------------------------
# 2. Configure CORS
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://california-house-price-prediction-iota.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# 3. Load trained ML model
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "california_house_price_model.pkl"

model = joblib.load(MODEL_PATH)


# --------------------------------------------------
# 4. Define model feature columns
# --------------------------------------------------

FEATURE_COLUMNS = [
    "MedInc",
    "HouseAge",
    "AveRooms",
    "AveBedrms",
    "Population",
    "AveOccup",
    "Latitude",
    "Longitude"
]


# --------------------------------------------------
# 5. Define input schema and validation
# --------------------------------------------------

class HouseFeatures(BaseModel):

    MedInc: float = Field(gt=0)
    HouseAge: float = Field(gt=0, le=100)
    AveRooms: float = Field(gt=0)
    AveBedrms: float = Field(gt=0)
    Population: float = Field(ge=0)
    AveOccup: float = Field(gt=0)
    Latitude: float = Field(ge=32, le=42)
    Longitude: float = Field(ge=-125, le=-114)


# --------------------------------------------------
# 6. Home endpoint
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "California House Price Prediction API is running"
    }


# --------------------------------------------------
# 7. Health check endpoint
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }


# --------------------------------------------------
# 8. House price prediction endpoint
# --------------------------------------------------

@app.post("/predict")
def predict_price(data: HouseFeatures):

    try:
        input_data = data.model_dump()

        input_df = pd.DataFrame(
            [input_data],
            columns=FEATURE_COLUMNS
        )

        prediction = float(model.predict(input_df)[0])

        if not 0 <= prediction <= 5.00001:
            raise ValueError("Prediction outside expected target range")

        predicted_price = prediction * 100000

        return {
            "success": True,
            "prediction": {
                "price_in_100k_usd": round(prediction, 4),
                "price_in_usd": round(predicted_price, 2)
            },
            "currency": "USD",
            "model": "Random Forest",
            "note": "Historical California census-block median-value estimate; original target values were capped around $500,000."
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )