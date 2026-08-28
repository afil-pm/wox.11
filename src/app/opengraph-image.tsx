import { ImageResponse } from "next/og";

export const size = {
  width: 1024,
  height: 1024,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            WOX.11
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#a1a1aa",
              marginTop: 16,
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            Modern Essentials
          </div>
          <div
            style={{
              display: "flex",
              gap: 40,
              marginTop: 40,
            }}
          >
            {["Shirts", "T-Shirts", "Pants"].map((item) => (
              <div
                key={item}
                style={{
                  fontSize: 20,
                  color: "#d4d4d8",
                  padding: "12px 24px",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#71717a",
              marginTop: 40,
            }}
          >
            wox11.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
