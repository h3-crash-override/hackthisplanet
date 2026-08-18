import dynamic from 'next/dynamic'

// Swagger UI loaded client-side only (SSR would fail on window references)
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

// No auth gate - A05 (Swagger UI exposed in production)
export default function ApiDocs() {
  return (
    <div style={{ margin: '0 -12px' }}>
      <div className="alert alert-warning mx-3 mb-0 mt-2">
        Swagger UI exposed without authentication (A05). &quot;Try it out&quot; is fully enabled.
        The spec at <a href="/api/openapi">/api/openapi</a> documents all vulnerable endpoints.
      </div>
      <SwaggerUI
        url="/api/openapi"
        tryItOutEnabled={true}
        persistAuthorization={true}
      />
    </div>
  )
}
