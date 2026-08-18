import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Bootstrap loaded from CDN without integrity attribute - A08 (missing SRI) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
        />
        <meta name="generator" content="Next.js 14.0.4" />
      </Head>
      <body>
        <Main />
        <NextScript />
        {/* Bootstrap JS without integrity - A08 */}
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
      </body>
    </Html>
  )
}
