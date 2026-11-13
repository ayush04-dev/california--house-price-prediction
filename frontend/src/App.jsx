
import { useState } from "react";
import "./App.css";

const initialForm = {
  MedInc: 5.0,
  HouseAge: 25,
  AveRooms: 5.0,
  AveBedrms: 1.0,
  Population: 1000,
  AveOccup: 3.0,
  Latitude: 34.05,
  Longitude: -118.25,
};

const fields = [
  { name: "MedInc", label: "Median Income", unit: "In $10,000s" },
  { name: "HouseAge", label: "House Age", unit: "Years" },
  { name: "AveRooms", label: "Average Rooms", unit: "Per household" },
  { name: "AveBedrms", label: "Average Bedrooms", unit: "Per household" },
  { name: "Population", label: "Population", unit: "Block population" },
  { name: "AveOccup", label: "Average Occupancy", unit: "Persons per household" },
  { name: "Latitude", label: "Latitude", unit: "Geographic coordinate" },
  { name: "Longitude", label: "Longitude", unit: "Geographic coordinate" },
];

function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [
          key,
          Number(value),
        ])
      );

      const API_URL = import.meta.env.VITE_API_URL;

const response = await fetch(
  `${API_URL}/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to generate prediction"
        );
      }

      setResult(data.prediction);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check whether FastAPI is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">H</div>
          <span>HousePredict</span>
        </div>
        <span className="status">
          <span className="status-dot"></span>
          ML Prediction System
        </span>
      </header>

      <main className="container">
        <section className="hero">
          <span className="eyebrow">CALIFORNIA HOUSING ANALYTICS</span>
          <h1>Estimate Your Property Value</h1>
          <p>
            Enter property and location characteristics to generate
            a house value estimate using our Random Forest model.
          </p>
        </section>

        <div className="dashboard">
          <section className="form-card">
            <div className="section-heading">
              <div>
                <h2>Property Details</h2>
                <p>Enter all eight model features below.</p>
              </div>
              <span className="field-count">8 FEATURES</span>
            </div>

            <form onSubmit={handlePredict}>
              <div className="form-grid">
                {fields.map((field) => (
                  <div className="input-group" key={field.name}>
                    <label htmlFor={field.name}>
                      {field.label}
                    </label>

                    <input
                      id={field.name}
                      type="number"
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      step="any"
                      required
                    />

                    <small>{field.unit}</small>
                  </div>
                ))}
              </div>

              <button
                className="predict-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Generating Prediction..." : "Predict House Price"}
              </button>
            </form>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </section>

          <aside className="result-card">
            <div className="result-icon">↗</div>
            <span className="result-label">PREDICTION RESULT</span>

            {result ? (
              <>
                <h2 className="price">
                  ${result.price_in_usd.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h2>
                <p className="result-description">
                  Estimated median house value
                </p>
                <div className="result-divider"></div>
                <div className="result-detail">
                  <span>Model</span>
                  <strong>Random Forest</strong>
                </div>
                <div className="result-detail">
                  <span>Prediction scale</span>
                  <strong>
                    {result.price_in_100k_usd} × $100,000
                  </strong>
                </div>
              </>
            ) : (
              <div className="empty-result">
                <h2>--</h2>
                <p>
                  Your predicted house value will appear here
                  after submitting the property details.
                </p>
              </div>
            )}

            <div className="result-note">
              This is an estimate based on historical California
              census-block data. Original target values were capped
              around $500,000. It is not a live property valuation.
            </div>
          </aside>
        </div>

        <footer>
          California House Price Prediction · Powered by FastAPI
          and Random Forest
        </footer>
      </main>
    </div>
  );
}

export default App;
