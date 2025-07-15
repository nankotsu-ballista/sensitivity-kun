from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # ← 必要
import uuid  # 追加
from pydantic import BaseModel
from optimizer import suggest_next
import pandas as pd
import os
from optimizer import suggest_next, save_to_csv

app = FastAPI()

# ★ CORSミドルウェアの追加（ "*" に変更）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← ← ← 🔥ここを一時的に "*" に変える
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "data.csv"

class InputData(BaseModel):
    sensitivity: float
    score: float
    min_sens: float
    max_sens: float

@app.post("/suggest")
def get_next_sensitivity(data: InputData):
    print(f"Received data: {data}")  # デバッグ用ログ
    try:
        save_to_csv(data.sensitivity, data.score)

        # 感度と予測スコアのタプルが返ってくる
        next_sens, _ = suggest_next(data.min_sens, data.max_sens)

        print(f"Next sensitivity: {next_sens}")
        return {"next_sensitivity": next_sens}  # 👈 数値だけ返す！

    except Exception as e:
        print(f"Error: {e}")
        raise e

@app.get("/history")
def get_history():
    if not os.path.exists(DATA_FILE):
        return []
    df = pd.read_csv(DATA_FILE)
    return df.to_dict(orient="records")

@app.post("/reset")
def reset_data():
    if os.path.exists(DATA_FILE):
        os.remove(DATA_FILE)
    return {"status": "reset done"}
