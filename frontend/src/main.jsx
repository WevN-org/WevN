import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import  ReactDOM  from 'react-dom/client'
import App from './app.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// -- trying in non-strict mode so as not to trigger two time rendering (for ws) --
// ReactDOM.createRoot(document.getElementById("root")).render(
//   <App />
// );