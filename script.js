(() => {
  "use strict";

  // Change this to your deployed API URL (e.g. "https://predictive-maintenance-api.onrender.com")
  const API_BASE = "http://localhost:8000";

  const form = document.getElementById("predict-form");
  const submitBtn = document.getElementById("submit-btn");

  const stateIdle = document.getElementById("state-idle");
  const stateLoading = document.getElementById("state-loading");
  const stateResult = document.getElementById("state-result");
  const stateError = document.getElementById("state-error");

  const gaugeFill = document.getElementById("gauge-fill");
  const readoutNumber = document.getElementById("readout-number");
  const readoutStatus = document.getElementById("readout-status");
  const metaPredicted = document.getElementById("meta-predicted");
  const errorCopy = document.getElementById("error-copy");
  const retryBtn = document.getElementById("retry-btn");

  const GAUGE_ARC_LENGTH = 314; // approx pi * r(100)

  // ---------------------------------------------------------
  // Machine type toggle
  // ---------------------------------------------------------
  const typeToggle = document.getElementById("type-toggle");
  const typeHidden = document.getElementById("machine_type");

  typeToggle.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      typeToggle.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      typeHidden.value = btn.dataset.value;
    });
  });

  // ---------------------------------------------------------
  // State switching
  // ---------------------------------------------------------
  function showState(el) {
    [stateIdle, stateLoading, stateResult, stateError].forEach((s) => s.classList.add("hidden"));
    el.classList.remove("hidden");
  }

  // ---------------------------------------------------------
  // Render a prediction result onto the gauge
  // ---------------------------------------------------------
  function renderResult(data) {
    const proba = data.failure_probability;
    const pct = Math.round(proba * 100);
    const failed = data.predicted_failure === 1;

    stateResult.classList.remove("risk-normal", "risk-elevated", "risk-high");

    let riskClass, statusText;
    if (failed) {
      riskClass = "risk-high";
      statusText = "High risk — schedule maintenance";
    } else if (proba >= 0.2) {
      riskClass = "risk-elevated";
      statusText = "Elevated risk — monitor closely";
    } else {
      riskClass = "risk-normal";
      statusText = "Operating normally";
    }
    stateResult.classList.add(riskClass);

    readoutNumber.textContent = pct + "%";
    readoutStatus.textContent = statusText;
    metaPredicted.textContent = failed ? "Failure" : "No failure";

    const offset = GAUGE_ARC_LENGTH * (1 - proba);
    // reset then animate on next frame so the transition always plays
    gaugeFill.style.transition = "none";
    gaugeFill.style.strokeDashoffset = GAUGE_ARC_LENGTH;
    requestAnimationFrame(() => {
      gaugeFill.style.transition = "";
      gaugeFill.style.strokeDashoffset = offset;
    });

    showState(stateResult);
  }

  // ---------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------
  async function runDiagnostic() {
    showState(stateLoading);
    submitBtn.disabled = true;

    const payload = {
      Type: typeHidden.value,
      air_temperature_k: parseFloat(document.getElementById("air_temperature_k").value),
      process_temperature_k: parseFloat(document.getElementById("process_temperature_k").value),
      rotational_speed_rpm: parseFloat(document.getElementById("rotational_speed_rpm").value),
      torque_nm: parseFloat(document.getElementById("torque_nm").value),
      tool_wear_min: parseFloat(document.getElementById("tool_wear_min").value),
    };

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      renderResult(data);
    } catch (err) {
      errorCopy.textContent =
        err.message === "Failed to fetch"
          ? "Can't reach the model service. Check that the API is running and reachable."
          : `Something went wrong: ${err.message}`;
      showState(stateError);
    } finally {
      submitBtn.disabled = false;
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runDiagnostic();
  });

  retryBtn.addEventListener("click", runDiagnostic);
})();
