
export const reqProtocol = (req) => {
    const host = req.headers.host;
    if (host.includes("localhost")) return "http";
    // if it is a Vercel deployment, this will probably be present and we can assume it is secure
    if (req.headers["x-now-deployment-url"]) return "https";
    // if Next.js is running on a custom server, like Express, req.protocol will probably be available
    return req["protocol"] || "https";
};
