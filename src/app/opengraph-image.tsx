import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "MapBench — Free Maps & Geographic Tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0c2417 0%, #143d24 55%, #1d5c34 100%)",
          position: "relative",
        }}
      >
        {/* decorative circles */}
        <div
          style={{
            position: "absolute",
            right: "-120px",
            top: "-120px",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background: "rgba(124, 195, 157, 0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "80px",
            bottom: "-160px",
            width: "380px",
            height: "380px",
            borderRadius: "50%",
            background: "rgba(124, 195, 157, 0.08)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#7cc39d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "28px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                border: "8px solid #0c2417",
              }}
            />
          </div>
          <div style={{ fontSize: "40px", color: "#bfe3cd", letterSpacing: "4px" }}>MAPBENCH.SITE</div>
        </div>
        <div style={{ fontSize: "120px", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
          MapBench
        </div>
        <div style={{ fontSize: "48px", color: "#d7ecdf", marginTop: "24px" }}>
          Free Maps &amp; Geographic Tools
        </div>
      </div>
    ),
    { ...size }
  );
}
