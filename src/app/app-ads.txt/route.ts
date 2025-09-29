
import { getSiteInfo } from "@/lib/firestore-service";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const siteInfo = await getSiteInfo();
        const appAdsText = siteInfo?.appAdsTxt || "";

        return new NextResponse(appAdsText, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });
    } catch (error) {
        console.error("Error fetching app-ads.txt:", error);
        return new NextResponse("Error fetching app-ads.txt content.", {
            status: 500,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });
    }
}
