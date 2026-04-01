import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>EthioSocial | Decentralized Social Media for Ethiopia 🇪🇹</title>
        <meta name="description" content="Connect, share, and earn on Ethiopia's first decentralized social media platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ethio-social.vercel.app/" />
        <meta property="og:title" content="EthioSocial - Decentralized Social Media for Ethiopia" />
        <meta property="og:description" content="Connect, share, and earn on Ethiopia's first decentralized social media platform" />
        <meta property="og:image" content="/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://ethio-social.vercel.app/" />
        <meta property="twitter:title" content="EthioSocial" />
        <meta property="twitter:description" content="Decentralized social media for Ethiopia" />
        <meta property="twitter:image" content="/og-image.png" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
