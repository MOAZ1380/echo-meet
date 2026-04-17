type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonText = "signin_with" | "signup_with" | "continue_with";

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    element: HTMLElement,
    options: {
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: GoogleButtonText;
      shape?: "rectangular" | "pill" | "circle" | "square";
      width?: number;
      logo_alignment?: "left" | "center";
    },
  ) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

/**
 * Loads the Google Identity Services script once per app session.
 */
export function loadGoogleIdentityScript() {
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById("google-identity-services");

    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));

    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Renders the Google sign-in button into a provided container.
 */
export async function renderGoogleButton(
  container: HTMLElement,
  options: {
    clientId: string;
    text: GoogleButtonText;
    onCredential: (credential: string) => void;
  },
) {
  await loadGoogleIdentityScript();

  const googleAccounts = window.google?.accounts?.id;

  if (!googleAccounts) {
    throw new Error("Google Identity Services is unavailable");
  }

  container.innerHTML = "";

  googleAccounts.initialize({
    client_id: options.clientId,
    callback: (response) => {
      if (response.credential) {
        options.onCredential(response.credential);
      }
    },
    cancel_on_tap_outside: true,
  });

  googleAccounts.renderButton(container, {
    theme: "outline",
    size: "large",
    text: options.text,
    shape: "rectangular",
    width: container.clientWidth || 320,
    logo_alignment: "left",
  });
}
