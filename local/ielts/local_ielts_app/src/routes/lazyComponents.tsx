import { lazy } from "react";

// Lazy load components for better performance
export const ReadingTest = lazy(() => import("../components/ReadingTest"));
export const ResultPage = lazy(() => import("../components/ResultPage"));

// Placeholder components for other sections
export const ListeningTest = lazy(() =>
  Promise.resolve({
    default: () => (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#666",
          fontSize: "18px",
        }}
      >
        <h2 style={{ marginBottom: "20px", fontSize: "24px", color: "#333" }}>
          Listening Section
        </h2>
        <p>Audio player and questions will appear here</p>
      </div>
    ),
  })
);

export const WritingTest = lazy(() =>
  Promise.resolve({
    default: () => (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#666",
          fontSize: "18px",
        }}
      >
        <h2 style={{ marginBottom: "20px", fontSize: "24px", color: "#333" }}>
          Writing Section
        </h2>
        <p>Text editor and word count will appear here</p>
      </div>
    ),
  })
);

export const SpeakingTest = lazy(() =>
  Promise.resolve({
    default: () => (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#666",
          fontSize: "18px",
        }}
      >
        <h2 style={{ marginBottom: "20px", fontSize: "24px", color: "#333" }}>
          Speaking Section
        </h2>
        <p>Voice recorder will appear here</p>
      </div>
    ),
  })
);
