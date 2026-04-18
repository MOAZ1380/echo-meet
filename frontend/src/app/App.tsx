import { RouterProvider } from "react-router";
import { router } from "./routes";
import "../styles/global.css";
import { Toaster } from "sonner";

/**
 * Echo Meet - Main Application Component
 * A modern video conferencing web application
 */

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
