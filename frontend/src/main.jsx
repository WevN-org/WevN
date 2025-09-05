import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import  ReactDOM  from 'react-dom/client'
import App from './app.jsx'
import NodesProvider from './contexts/nodes-context/nodes_provider.jsx'
import DomainProvider from './contexts/domain-context/domain_provider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NodesProvider>
      <DomainProvider>
        <App />
      </DomainProvider>
    </NodesProvider>
  </StrictMode>,
)
// -- trying in non-strict mode so as not to trigger two time rendering (for ws) --
// ReactDOM.createRoot(document.getElementById("root")).render(
//   <App />
// );