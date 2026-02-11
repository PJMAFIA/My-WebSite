import { createRoot } from "react-dom/client";
import App from "./App.tsx"; // Ensure this matches your filename
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);