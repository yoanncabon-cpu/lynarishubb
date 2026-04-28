import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F5922F 0%, #D4530A 100%)",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontWeight: 900,
            fontSize: 20,
            fontFamily: "system-ui",
            lineHeight: 1,
            letterSpacing: "-1px",
          }}
        >
          L
        </div>
      </div>
    ),
    { ...size },
  )
}
