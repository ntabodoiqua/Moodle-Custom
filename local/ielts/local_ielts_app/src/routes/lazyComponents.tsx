import { lazy } from "react";

// Lazy load components for better performance
export const ReadingTest = lazy(() => import("../components/ReadingTest"));
export const ListeningTest = lazy(() => import("../components/ListeningTest"));
export const WritingTest = lazy(() => import("../components/WritingTest"));
export const SpeakingTest = lazy(() => import("../components/SpeakingTest"));
export const ResultPage = lazy(() => import("../components/ResultPage"));
