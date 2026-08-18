import Layout from '../components/Layout'
// swagger-ui-react CSS loaded globally for /docs page
import 'swagger-ui-react/swagger-ui.css'

export default function App({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}
