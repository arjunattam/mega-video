import './styles.css';
import { HMSRoomProvider } from "@100mslive/react-sdk";

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
    return <HMSRoomProvider>
        <Component {...pageProps} />
    </HMSRoomProvider>
}
