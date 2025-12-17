import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Define Moodle configuration interface
interface MoodleConfig {
  userId: number;
  sesskey: string;
  wwwroot: string;
  apiEndpoint: string;
}

// Find the root element
const rootElement = document.getElementById("root");

if (rootElement) {
  // Extract and parse the data-moodle-config attribute
  const configAttr = rootElement.getAttribute("data-moodle-config");

  if (configAttr) {
    try {
      const config: MoodleConfig = JSON.parse(configAttr);

      // Clear any existing content to prevent DOM conflicts with Moodle
      rootElement.innerHTML = "";

      // Mount the React App with config as props (without StrictMode to avoid double-render in dev)
      createRoot(rootElement).render(<App config={config} />);
    } catch (error) {
      console.error("Failed to parse Moodle config:", error);
    }
  } else {
    console.error("Moodle config not found on root element");
  }
} else {
  console.error("Root element not found");
}
