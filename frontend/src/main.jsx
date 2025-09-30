import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import  ReactDOM  from 'react-dom/client'
// import App from './app.jsx'
import NodesProvider from './contexts/nodes-context/nodes_provider.jsx'
import DomainProvider from './contexts/domain-context/domain_provider.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import AppRouter from './AppRouter.jsx'
import { DomainsListProvider } from './contexts/domans-list-context/domains_list_provider.jsx'
import { LinksProvider } from './contexts/link-context/link_provider.jsx'
import { RagListProvider } from './contexts/rag-list-context/rag_list_provider.jsx'


const CLIENT_ID = "908876742569-7pqs6n9cfd64q37sv7jbm9sj955ctd8i.apps.googleusercontent.com"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <DomainsListProvider>
        <LinksProvider>
          <NodesProvider>
            <DomainProvider>
              <RagListProvider>
                <AppRouter />
              </RagListProvider>
            </DomainProvider>
          </NodesProvider>
        </LinksProvider>
      </DomainsListProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
// -- trying in non-strict mode so as not to trigger two time rendering (for ws) --
// ReactDOM.createRoot(document.getElementById("root")).render(
//   <App />
// );