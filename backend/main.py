from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from io import BytesIO

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from models.demand_model import train_and_predict_deal_closing_probability
from models.finance_model import predict_cash_balance_next_10_days
from models.sales_model import train_and_predict_next_5_days


app = FastAPI(title="Corelytics API")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


inventory_data = [
	{"id": 1, "item": "Laptop", "stock": 40, "daily_sales": 3},
	{"id": 2, "item": "Mouse", "stock": 20, "daily_sales": 5},
	{"id": 3, "item": "Keyboard", "stock": 18, "daily_sales": 2},
]

finance_data = {
	"cash": 50000,
	"daily_income": 3200,
	"daily_expense": 2800,
}

sales_data = [
	{"deal_id": "D-1001", "customer": "Acme Retail", "value": 15000, "probability": 0.82},
	{"deal_id": "D-1002", "customer": "North Star LLC", "value": 7000, "probability": 0.65},
	{"deal_id": "D-1003", "customer": "Bluebird Tech", "value": 9800, "probability": 0.77},
]


def calculate_inventory_days_left():
	days_left = {}
	for item in inventory_data:
		if item["daily_sales"] <= 0:
			days_left[item["item"]] = None
		else:
			days_left[item["item"]] = round(item["stock"] / item["daily_sales"], 1)
	return days_left


def forecast_cash(days=10):
	daily_net = finance_data["daily_income"] - finance_data["daily_expense"]
	return finance_data["cash"] + (daily_net * days)


def get_high_probability_deals():
	return [deal for deal in sales_data if deal["probability"] > 0.7]


def build_plot_response(fig):
	buffer = BytesIO()
	fig.tight_layout()
	fig.savefig(buffer, format="png", dpi=160)
	plt.close(fig)
	buffer.seek(0)
	return StreamingResponse(buffer, media_type="image/png")


@app.get("/")
def get_home():
	return {
		"message": "Corelytics API is running",
		"endpoints": [
			"/inventory",
			"/finance",
			"/sales",
			"/ai/insights",
			"/models/sales/forecast",
			"/models/sales/forecast/plot",
			"/models/finance/cash-forecast",
			"/models/finance/cash-forecast/plot",
			"/models/deals/close-probability",
			"/models/deals/close-probability/plot",
			"/models/demo/plots",
		],
		"docs": "/docs",
	}


@app.get("/inventory")
def get_inventory():
	return {
		"module": "inventory",
		"count": len(inventory_data),
		"items": inventory_data,
		"inventory_days_left": calculate_inventory_days_left(),
	}


@app.get("/finance")
def get_finance():
	cash_forecast = forecast_cash(10)
	return {
		"module": "finance",
		"data": finance_data,
		"cash_forecast_10_days": cash_forecast,
	}


@app.get("/sales")
def get_sales():
	high_probability_deals = get_high_probability_deals()
	return {
		"module": "sales",
		"count": len(sales_data),
		"deals": sales_data,
		"high_probability_deals": high_probability_deals,
	}


@app.get("/ai/insights")
def get_ai_insights():
	inventory_days_left = calculate_inventory_days_left()
	cash_forecast = forecast_cash(10)
	high_probability_deals = get_high_probability_deals()

	alerts = []
	recommendations = []

	for item_name, days_left in inventory_days_left.items():
		if days_left is not None and days_left <= 7:
			alerts.append(f"{item_name} may run out in about {days_left} days")
			recommendations.append(f"Reorder {item_name} soon")

	if cash_forecast < finance_data["cash"]:
		alerts.append("Cash balance is projected to decrease over the next 10 days")

	if cash_forecast < 0:
		alerts.append("Cash could become negative in 10 days")
		recommendations.append("Reduce expense or increase income quickly")
	else:
		recommendations.append("Keep daily cash flow positive")

	if high_probability_deals:
		recommendations.append(
			f"Prioritize closing {len(high_probability_deals)} high-probability deals"
		)
	else:
		alerts.append("No high-probability deals found")
		recommendations.append("Improve deal quality in the sales pipeline")

	if not alerts:
		alerts.append("No major risk detected today")

	inventory_risk = any(
		days_left is not None and days_left <= 7
		for days_left in inventory_days_left.values()
	)
	summary = "Business is stable overall. "

	if inventory_risk:
		summary += "Some inventory items need quick restocking. "

	if cash_forecast < finance_data["cash"]:
		summary += "Cash trend is downward, so monitor spending. "
	else:
		summary += "Cash trend is healthy for the next 10 days. "

	summary += f"There are {len(high_probability_deals)} strong sales opportunities."

	return {
		"alerts": alerts,
		"recommendations": recommendations,
		"predictions": {
			"inventory_days_left": inventory_days_left,
			"cash_forecast": cash_forecast,
		},
		"summary": summary,
	}


@app.get("/models/sales/forecast")
def get_sales_forecast_model_output():
	forecast = train_and_predict_next_5_days()
	return {
		"model": "LinearRegression",
		"module": "sales",
		"predictions": forecast.to_dict(orient="records"),
	}


@app.get("/models/sales/forecast/plot")
def get_sales_forecast_plot():
	forecast = train_and_predict_next_5_days()
	x_values = forecast["date"].tolist()
	y_values = forecast["predicted_sales"].tolist()

	fig, ax = plt.subplots(figsize=(10, 4.5))
	ax.plot(x_values, y_values, marker="o", linewidth=2.5, color="#1f77b4")
	ax.fill_between(x_values, y_values, color="#1f77b4", alpha=0.15)
	ax.set_title("Sales Forecast - Next 5 Days")
	ax.set_xlabel("Date")
	ax.set_ylabel("Predicted Sales")
	ax.grid(alpha=0.3)
	plt.setp(ax.get_xticklabels(), rotation=25, ha="right")

	return build_plot_response(fig)


@app.get("/models/finance/cash-forecast")
def get_finance_forecast_model_output():
	forecast = predict_cash_balance_next_10_days()
	return {
		"model": "LinearRegression",
		"module": "finance",
		"predictions": forecast.to_dict(orient="records"),
	}


@app.get("/models/finance/cash-forecast/plot")
def get_finance_forecast_plot():
	forecast = predict_cash_balance_next_10_days()
	x_values = forecast["date"].tolist()
	y_values = forecast["predicted_cash_balance"].tolist()

	fig, ax = plt.subplots(figsize=(10, 4.5))
	ax.plot(x_values, y_values, marker="o", linewidth=2.5, color="#2ca02c")
	ax.fill_between(x_values, y_values, color="#2ca02c", alpha=0.15)
	ax.set_title("Cash Balance Forecast - Next 10 Days")
	ax.set_xlabel("Date")
	ax.set_ylabel("Predicted Cash Balance")
	ax.grid(alpha=0.3)
	plt.setp(ax.get_xticklabels(), rotation=25, ha="right")

	return build_plot_response(fig)


@app.get("/models/deals/close-probability")
def get_deals_classification_model_output():
	predictions = train_and_predict_deal_closing_probability()
	return {
		"model": "LogisticRegression",
		"module": "sales_deals",
		"predictions": predictions.to_dict(orient="records"),
	}


@app.get("/models/deals/close-probability/plot")
def get_deals_probability_plot():
	predictions = train_and_predict_deal_closing_probability()
	plot_data = predictions.sort_values("close_probability", ascending=False).head(8)
	x_labels = [f"Deal {index + 1}" for index in range(len(plot_data))]
	y_values = plot_data["close_probability"].tolist()

	fig, ax = plt.subplots(figsize=(10, 4.5))
	bars = ax.bar(x_labels, y_values, color="#ff7f0e", alpha=0.85)
	ax.set_title("Top Deal Close Probabilities")
	ax.set_xlabel("Deals")
	ax.set_ylabel("Probability")
	ax.set_ylim(0, 1)
	ax.grid(axis="y", alpha=0.3)

	for bar, value in zip(bars, y_values):
		ax.text(
			bar.get_x() + bar.get_width() / 2,
			value + 0.02,
			f"{value:.2f}",
			ha="center",
			fontsize=9,
		)

	return build_plot_response(fig)


@app.get("/models/demo/plots")
def get_model_demo_plot():
	sales_forecast = train_and_predict_next_5_days()
	finance_forecast = predict_cash_balance_next_10_days()
	deals_prediction = train_and_predict_deal_closing_probability()
	deals_top = deals_prediction.sort_values("close_probability", ascending=False).head(6)

	fig, axes = plt.subplots(1, 3, figsize=(18, 5.2))

	axes[0].plot(
		sales_forecast["date"].tolist(),
		sales_forecast["predicted_sales"].tolist(),
		marker="o",
		linewidth=2,
		color="#1f77b4",
	)
	axes[0].set_title("Sales Forecast")
	axes[0].tick_params(axis="x", rotation=25)
	axes[0].grid(alpha=0.3)

	axes[1].plot(
		finance_forecast["date"].tolist(),
		finance_forecast["predicted_cash_balance"].tolist(),
		marker="o",
		linewidth=2,
		color="#2ca02c",
	)
	axes[1].set_title("Cash Forecast")
	axes[1].tick_params(axis="x", rotation=25)
	axes[1].grid(alpha=0.3)

	axes[2].bar(
		[f"Deal {index + 1}" for index in range(len(deals_top))],
		deals_top["close_probability"].tolist(),
		color="#ff7f0e",
	)
	axes[2].set_title("Deal Close Probability")
	axes[2].set_ylim(0, 1)
	axes[2].grid(axis="y", alpha=0.3)

	fig.suptitle("Corelytics AI Demo Dashboard", fontsize=14, fontweight="bold")

	return build_plot_response(fig)


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)