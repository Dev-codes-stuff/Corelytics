from pathlib import Path

import pandas as pd
from sklearn.linear_model import LinearRegression


DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "sales.csv"


def train_and_predict_next_5_days():
	data = pd.read_csv(DATA_FILE)

	data["date"] = pd.to_datetime(data["date"])
	x = data["date"].map(pd.Timestamp.toordinal).to_numpy().reshape(-1, 1)
	y = data["sales"]

	model = LinearRegression()
	model.fit(x, y)

	last_date = data["date"].max()
	future_dates = [last_date + pd.Timedelta(days=day) for day in range(1, 6)]
	future_x = pd.Series(future_dates).map(pd.Timestamp.toordinal).to_numpy().reshape(-1, 1)

	predictions = model.predict(future_x)

	result = pd.DataFrame(
		{
			"date": [d.date().isoformat() for d in future_dates],
			"predicted_sales": [round(float(value), 2) for value in predictions],
		}
	)
	return result


if __name__ == "__main__":
	print(train_and_predict_next_5_days().to_string(index=False))
