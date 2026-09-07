import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware

model = joblib.load('model.joblib')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# A first Pydantic Model
class MachineReading(BaseModel):
    machine_type            : Literal['L', 'M', 'H']
    air_temperature_k       : float = Field(..., ge=250, le=350)
    process_temperature_k   : float = Field(..., ge=250, le=350)
    rotational_speed_rpm    : float = Field(..., ge=0)
    torque_nm               : float = Field(..., ge=0)
    tool_wear_min           : float = Field(..., ge=0)




# Describe what we send back
class PredictionResponse(BaseModel):
    failure_probability : float
    predicted_failure   : int
    #0.0342 -> not failed, 0.87 -> failed




@app.get('/')
def greet():
    return {'Welcome to the Predictive Maintenance API'}


@app.post('/predict', response_model=PredictionResponse) #0.0342
def predict(data: MachineReading):

    # Same domain-specific feature engineering used during training
    temp_diff           = data.process_temperature_k - data.air_temperature_k
    power_w             = data.torque_nm * (data.rotational_speed_rpm * (2 * np.pi / 60))
    wear_torque_product = data.tool_wear_min * data.torque_nm

    input_row = pd.DataFrame([{
        'Air temperature [K]'      : data.air_temperature_k,
        'Process temperature [K]'  : data.process_temperature_k,
        'Rotational speed [rpm]'   : data.rotational_speed_rpm,
        'Torque [Nm]'              : data.torque_nm,
        'Tool wear [min]'          : data.tool_wear_min,
        'temp_diff'                : temp_diff,
        'power_w'                  : power_w,
        'wear_torque_product'      : wear_torque_product,
        'Type'                     : data.machine_type
    }])

    proba = float(model.predict_proba(input_row)[0, 1]) #0.034
    threshold = 0.5
    return PredictionResponse(
        failure_probability=round(proba, 6),
        predicted_failure=int(proba >= threshold)
    )
