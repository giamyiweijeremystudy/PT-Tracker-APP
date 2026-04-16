import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply dark mode before first render to avoid flash
const savedDark = localStorage.getItem('pt-dark-mode');
if (savedDark === '1') document.documentElement.classList.add('dark');

createRoot(document.getElementById("root")!).render(<App />);
