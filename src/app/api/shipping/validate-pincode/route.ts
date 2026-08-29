import { NextRequest, NextResponse } from "next/server";

const INDIAN_STATES: Record<string, number> = {
  kerala: 0,
  "andhra pradesh": 50, "arunachal pradesh": 50, assam: 50, bihar: 50,
  "chhattisgarh": 50, goa: 50, gujarat: 50, haryana: 50,
  "himachal pradesh": 50, jharkhand: 50, karnataka: 50,
  "madhya pradesh": 50, maharashtra: 50, manipur: 50, meghalaya: 50,
  mizoram: 50, nagaland: 50, odisha: 50, punjab: 50, rajasthan: 50,
  sikkim: 50, "tamil nadu": 50, telangana: 50, tripura: 50,
  "uttar pradesh": 50, uttarakhand: 50, "west bengal": 50,
  "andaman and nicobar islands": 50, chandigarh: 50,
  "dadra and nagar haveli and daman and diu": 50, delhi: 50,
  "jammu and kashmir": 50, ladakh: 50, lakshadweep: 50, puducherry: 50,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode");

    if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
      return NextResponse.json({ error: "Valid 6-digit pincode required" }, { status: 400 });
    }

    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode.trim()}`);
    const data = await res.json();

    if (data[0]?.Status !== "Success" || !data[0]?.PostOffice?.length) {
      return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
    }

    const offices = data[0].PostOffice;
    const office = offices[0];
    const state = office.State || "";
    const stateLower = state.trim().toLowerCase();

    if (!(stateLower in INDIAN_STATES)) {
      return NextResponse.json({ shippingCost: -1, state, error: "Currently unavailable for this location." });
    }

    const shippingCost = INDIAN_STATES[stateLower];

    return NextResponse.json({ shippingCost, state });
  } catch (error) {
    console.error("GET /api/shipping/validate-pincode error:", error);
    return NextResponse.json({ shippingCost: 0, state: "", error: "Could not validate pincode" });
  }
}
