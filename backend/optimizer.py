import pandas as pd
import numpy as np
from skopt import Optimizer
from skopt.space import Real
import os

# データファイルのパス
DATA_FILE = "data.csv"

# 次に試すべき感度をベイズ最適化（ガウス過程）で提案
opt = Optimizer(
    dimensions=[Real(0.5, 5.0)],
    base_estimator="GP",
    acq_func="EI",
    random_state=42
)

# 履歴反映しつつ提案
def suggest_next(min_sens=0.5, max_sens=5.0):
    if not os.path.exists(DATA_FILE):
        return np.random.uniform(min_sens, max_sens), None

    df = pd.read_csv(DATA_FILE)
    df = df.dropna()
    df["sensitivity"] = pd.to_numeric(df["sensitivity"], errors="coerce")
    df["score"] = pd.to_numeric(df["score"], errors="coerce")
    df = df.dropna()
    df = df[(df["sensitivity"] >= min_sens) & (df["sensitivity"] <= max_sens)]

    if len(df) < 2:
        return np.random.uniform(min_sens, max_sens), None

    # 最新1件だけをtellしていく（1ステップ最適化）
    last = df.iloc[-1]
    X = [[last["sensitivity"]]]
    y = [-last["score"]]

    opt.tell(X, y)  # 追加学習
    next_sens = opt.ask()[0]
    return next_sens, None


# 感度とスコアをCSVに保存
def save_to_csv(sensitivity: float, score: float):
    new_data = {
        "sensitivity": sensitivity,
        "score": score
    }

    try:
        df = pd.read_csv(DATA_FILE)
    except FileNotFoundError:
        df = pd.DataFrame(columns=["sensitivity", "score"])

    df = pd.concat([df, pd.DataFrame([new_data])], ignore_index=True)
    df.to_csv(DATA_FILE, index=False)
