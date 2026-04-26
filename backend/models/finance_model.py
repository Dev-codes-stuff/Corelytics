from pathlib import Path

import pandas as pd
from sklearn.linear_model import LinearRegression


DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "finance.csv"
INITIAL_CASH = 50000


def predict_cash_balance_next_10_days():
	data = pd.read_csv(DATA_FILE)

	data["date"] = pd.to_datetime(data["date"])
	data["daily_net"] = data["income"] - data["expense"]

	# Build historical cash balance from income and expense.
	data["cash_balance"] = INITIAL_CASH + data["daily_net"].cumsum()

	x = data["date"].map(pd.Timestamp.toordinal).to_numpy().reshape(-1, 1)
	y = data["cash_balance"]

	model = LinearRegression()
	model.fit(x, y)

	last_date = data["date"].max()
	future_dates = [last_date + pd.Timedelta(days=day) for day in range(1, 11)]
	future_x = pd.Series(future_dates).map(pd.Timestamp.toordinal).to_numpy().reshape(-1, 1)

	predicted_cash = model.predict(future_x)

	result = pd.DataFrame(
		{
			"date": [d.date().isoformat() for d in future_dates],
			"predicted_cash_balance": [round(float(value), 2) for value in predicted_cash],
		}
	)
	return result


if __name__ == "__main__":
	print(predict_cash_balance_next_10_days().to_string(index=False))
