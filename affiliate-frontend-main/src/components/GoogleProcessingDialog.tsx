"use client";

import { useEffect, useRef } from "react";
import AppIcon from "./AppIcon";
import "./google-phone-dialog.css";

export default function GoogleProcessingDialog({ demo }: { demo: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const modal = dialog.current;
    modal?.showModal();
    return () => modal?.close();
  }, []);

  return <dialog ref={dialog} className="google-phone-dialog google-processing-dialog" aria-labelledby="google-processing-title" aria-describedby="google-processing-description" aria-busy="true" onCancel={event => event.preventDefault()}>
    <div className="google-processing-icon" aria-hidden="true"><AppIcon name="google"/><span/></div>
    <h2 id="google-processing-title">{demo ? "Preparing your demo account." : "Connecting your Google account."}</h2>
    <p id="google-processing-description" role="status">{demo ? "Setting up the preview. Your mobile number is next." : "We’re confirming your account details. Just a moment…"}</p>
    <div className="google-success-progress" role="progressbar" aria-label="Processing Google sign-in"><span/></div>
  </dialog>;
}
