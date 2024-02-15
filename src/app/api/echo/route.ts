import { NextRequest, NextResponse } from "next/server";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";

// Environment variables for HUB URL and the host URL.
const HUB_URL = process.env.HUB_URL || "nemes.farcaster.xyz:2283";
const HOST_URL = process.env.HOST || "https://your-deployment-url.com";

const hubClient = getSSLHubRpcClient(HUB_URL);

console.log("HUB_URL", HUB_URL);

export async function POST(req: NextRequest) {
  try {
    // Parse the JSON body from the request
    const { untrustedData, trustedData } = await req.json();

    console.log("beans");

    // Decode the messageBytes from trustedData
    const frameMessage = Message.decode(Buffer.from(trustedData.messageBytes, "hex"));
    const validateResult = await hubClient.validateMessage(frameMessage);

    if (validateResult.isOk() && validateResult.value.valid) {
      const validMessage = validateResult.value.message;

      // Ensure the URL in the frameActionBody starts with the HOST URL
      let urlBuffer = validMessage?.data?.frameActionBody?.url ?? [];
      const urlString = Buffer.from(urlBuffer).toString("utf-8");
      console.log("urlString", urlString);
      if (!urlString.startsWith(HOST_URL)) {
        console.log("Invalid URL in frameActionBody", urlString);
        return new NextResponse("Bad Request", { status: 400 });
      }

      // Construct the image URL for the social sharing unfurl
      const message = untrustedData.inputText ?? "No message provided";
      const imageUrl = `${HOST_URL}/api/images/echo?date=${Date.now()}&message=${encodeURIComponent(message)}`;

      // Construct HTML response with appropriate metadata for social sharing
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Echo Says: ${message}</title>
            <meta property="og:title" content="Echo Says: ${message}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta name="fc:frame" content="vNext" />
            <meta name="fc:frame:post_url" content="${HOST_URL}" />
            <meta name="fc:frame:image" content="${imageUrl}" />
            <meta name="fc:frame:button:1" content="See code" />
            <meta name="fc:frame:button:1:action" content="post_redirect" />
            <meta name="fc:frame:button:2" content="(coming soon)" />
            <meta name="fc:frame:button:2:action" content="link" />
            <meta name="fc:frame:button:2:target" content="https://github.com/horsefacts/echo-the-dolphin" />
          </head>
          <body/>
        </html>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    } else {
      // If the message validation fails, return an Unauthorized response
      return new NextResponse("Unauthorized", { status: 401 });
    }
  } catch (error) {
    console.error('Error processing request:', error,);
    // Return a Bad Request response in case of any errors during processing
    return new NextResponse("Bad Request", { status: 400 });
  }
}

// Allow GET requests to be handled the same way as POST for simplicity
export const GET = POST;
