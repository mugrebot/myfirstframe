import { NextRequest, NextResponse } from "next/server";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";

const HUB_URL = process.env["HUB_URL"] || "nemes.farcaster.xyz:2283";
const hubClient = getSSLHubRpcClient(HUB_URL);

const postUrl = `${process.env["HOST"]}/api/code`;

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const { untrustedData, trustedData } = requestBody;

    // Add additional validation for `untrustedData` and `trustedData` here
    if (!untrustedData || !trustedData) {
      throw new Error('Invalid request body structure');
    }

    const { inputText } = untrustedData;
    const { messageBytes } = trustedData;

    const frameMessage = Message.decode(Buffer.from(messageBytes, "hex"));
    const validateResult = await hubClient.validateMessage(frameMessage);
    if (validateResult.isOk() && validateResult.value.valid) {
      // Your existing logic here...
    } else {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new NextResponse("Bad Request", { status: 400, statusText: "Could not process the request." });
  }
}

export const GET = POST;
