from pathlib import Path

import pandas as pd
from sklearn.linear_model import LogisticRegression


DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "deals.csv"


def train_and_predict_deal_closing_probability():
	data = pd.read_csv(DATA_FILE)

	stage_map = {
		"lead": 0,
		"qualified": 1,
		"proposal": 2,
		"negotiation": 3,
	}
	data["stage_encoded"] = data["stage"].map(stage_map)

	x = data[["deal_value", "stage_encoded", "previous_success"]]
	y = data["closed"]

	model = LogisticRegression()
	model.fit(x, y)

	probabilities = model.predict_proba(x)[:, 1]

	result = data[["deal_value", "stage", "previous_success", "closed"]].copy()
	result["close_probability"] = [round(float(p), 3) for p in probabilities]
	return result


if __name__ == "__main__":
	print(train_and_predict_deal_closing_probability().to_string(index=False))
