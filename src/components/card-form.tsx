import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Lock } from "lucide-react";

/* Square Web Payments SDK: the card number never touches our server, only a one-time token does. */
declare global {
  interface Window {
    Square?: any;
  }
}

export interface CardHandle {
  tokenize(d: { amount: string; givenName: string; familyName: string; email: string; phone: string }): Promise<string>;
}

let scriptPromise: Promise<void> | null = null;
function loadSquare(env: "sandbox" | "production") {
  if (window.Square) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = env === "production" ? "https://web.squarecdn.com/v1/square.js" : "https://sandbox.web.squarecdn.com/v1/square.js";
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("load"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export const CardForm = forwardRef<CardHandle, { appId: string; locationId: string; env: "sandbox" | "production" }>(
  function CardForm({ appId, locationId, env }, ref) {
    const box = useRef<HTMLDivElement>(null);
    const card = useRef<any>(null);
    const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

    useEffect(() => {
      let dead = false;
      (async () => {
        try {
          await loadSquare(env);
          const payments = window.Square.payments(appId, locationId);
          const c = await payments.card({
            style: {
              input: { fontSize: "16px" },
              ".input-container": { borderRadius: "12px" },
              ".input-container.is-focus": { borderColor: "#870d13" },
            },
          });
          if (dead) return c.destroy?.();
          await c.attach(box.current);
          card.current = c;
          setState("ready");
        } catch {
          if (!dead) setState("failed");
        }
      })();
      return () => {
        dead = true;
        card.current?.destroy?.();
        card.current = null;
      };
    }, [appId, locationId, env]);

    useImperativeHandle(ref, () => ({
      async tokenize({ amount, givenName, familyName, email, phone }) {
        if (!card.current) throw new Error("Card form isn't ready yet.");
        const r = await card.current.tokenize({
          amount,
          currencyCode: "USD",
          intent: "CHARGE",
          customerInitiated: true,
          sellerKeyedIn: false,
          billingContact: { givenName, familyName, email, phone },
        });
        if (r.status !== "OK") throw new Error(r.errors?.[0]?.message || "Please check your card details.");
        return r.token as string;
      },
    }));

    return (
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Lock className="h-4 w-4 text-brand" /> Card payment
        </p>
        <div ref={box} className="min-h-[90px]" />
        {state === "loading" && <p className="text-xs text-zinc-500">Loading secure card form…</p>}
        {state === "failed" && <p className="text-xs text-red-700">The card form couldn't load. Please refresh, or call us to order.</p>}
        <p className="mt-2 text-xs text-zinc-500">Payments are processed securely by Square.</p>
      </div>
    );
  }
);
