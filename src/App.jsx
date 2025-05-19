import React, { useState, useEffect } from "react";

const airportList = [
  "KORD", "KMDW", "KARR", "KDPA", "KGYY", "KPWK", "KLOT", "KUGN",
  "KMKE", "KENW", "KOSH", "KMWC", "KUSE", "KAZO", "KBTL", "KGRR",
  "KCID", "KCMI", "KDEC", "KFWA", "KGUS", "KLAF", "KMSN", "KMLI",
  "KRFD", "KJVL", "KSBN", "KEKM", "KVOK", "KCMY", "KDBQ"
];

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zuluTime, setZuluTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, "0");
      const minutes = String(now.getUTCMinutes()).padStart(2, "0");
      const seconds = String(now.getUTCSeconds()).padStart(2, "0");
      setZuluTime(`${hours}:${minutes}:${seconds}Z`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMETARs = async () => {
    setLoading(true);
    try {
      const allResults = [];

      for (const station of airportList) {
        const url = `https://avwx.rest/api/metar/${station}?token=gSWFcq87dqsQjDxyR6huSD8j1zuvKkXYzLE9GKSBqYc`;
        const res = await fetch(url);
        const data = await res.json();

        const raw = data?.raw || "";
        let score = 0;

        const vis = parseFloat(data?.visibility?.value ?? "10");
        if (vis < 1) score += 5;
        else if (vis < 3) score += 3;
        else if (vis < 5) score += 1;

        const wind = parseInt(data?.wind_speed?.value ?? "0");
        if (wind > 25) score += 5;
        else if (wind > 15) score += 3;
        else if (wind > 10) score += 1;

        const clouds = Array.isArray(data?.clouds) ? data.clouds : [];
        for (let cloud of clouds) {
          const base = parseInt(cloud.base ?? "10000");
          const type = cloud.type;
          if (["BKN", "OVC"].includes(type)) {
            if (base < 500) score += 5;
            else if (base < 1000) score += 3;
            else if (base < 3000) score += 1;
          }
        }

        if (raw.includes("TS") || raw.includes("CB") || raw.includes("+TSRA")) score += 5;

        allResults.push({ station, raw, score });
      }

      allResults.sort((a, b) => b.score - a.score);
      setResults(allResults.slice(0, 3));
    } catch (err) {
      console.error("Error fetching METARs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage:
          "url('https://upgradedpoints.com/wp-content/uploads/2019/07/Chicago-O-Hare-International-Airport-Tower.jpeg?auto=webp&disable=upscale&width=1420')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          backdropFilter: "blur(5px)",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          textAlign: "center",
          padding: "2rem",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: "800px", width: "100%" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
            Worst Weather in the Chicago ARTCC
          </h1>
          <button
            onClick={fetchMETARs}
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              marginBottom: "2rem",
            }}
          >
            {loading ? "Scanning..." : "Check METARs"}
          </button>

          {results.map((r, i) => (
            <div
              key={i}
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
              }}
            >
              <strong>
                {i + 1}. {r.station} — Score: {r.score}
              </strong>
              <p>{r.raw}</p>
            </div>
          ))}

          <div style={{ marginTop: "2rem", fontSize: "1.2rem", opacity: 0.8 }}>
            Current Zulu Time: {zuluTime}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
