import { useState, type FormEvent } from "react";
import { CheckCircle2, Minus, Plus, X, Loader2 } from "lucide-react";
import { useCart, describeMods } from "@/lib/cart";
import { submitOrder, type OrderDetails } from "@/lib/orders";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, money } from "@/lib/utils";
import { INFO } from "@/data/menu";

type Step = "cart" | "details" | "done";

const field =
  "h-12 w-full rounded-xl border border-black/10 bg-zinc-100 px-4 text-sm outline-none transition placeholder:text-zinc-500 focus:border-brand";

export function CartDrawer() {
  const { open, setOpen, lines, subtotal, tax, total, dispatch, count, openItem } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState(false);
  const [d, setD] = useState<OrderDetails>({ name: "", phone: "", email: "", method: "pickup", when: "asap" });

  const close = () => {
    setOpen(false);
    if (step === "done") setStep("cart");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await submitOrder({ details: d, lines });
      setConfirmation(res.confirmation);
      dispatch({ type: "clear" });
      setStep("done");
    } catch {
      // never show a confirmation unless the restaurant actually received the order
      setError(true);
    }
    setBusy(false);
  };

  return (
    <>
      <div
        onClick={close}
        className={cn(
          "fixed inset-0 z-[65] bg-black/50 transition-[opacity,visibility] duration-300",
          open ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
        )}
      />
      <aside
        data-lenis-prevent
        aria-hidden={!open}
        className={cn(
          "fixed right-0 top-0 z-[65] flex h-full w-full max-w-md flex-col border-l border-black/10 bg-white transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-16 flex-none items-center justify-between border-b border-black/10 px-5">
          <h2 className="font-display text-xl font-bold">
            {step === "cart" ? "Your order" : step === "details" ? "Checkout" : "Order placed"}
          </h2>
          <button onClick={close} aria-label="Close" className="rounded-full p-2 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "done" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            <h3 className="font-display text-3xl font-extrabold">Thanks, {d.name.split(" ")[0]}!</h3>
            <p className="text-zinc-600">
              Order <span className="font-semibold text-zinc-950">{confirmation}</span> was sent to the restaurant. If anything changes they'll contact you at {d.phone}. You'll pay at {d.method === "pickup" ? "pickup" : "delivery"}.</p>
            <Button onClick={close} className="mt-4">
              Done
            </Button>
          </div>
        ) : step === "cart" ? (
          <>
            <ul className="flex-1 divide-y divide-black/10 overflow-y-auto px-5">
              {lines.length === 0 && (
                <li className="py-20 text-center text-zinc-500">Your cart is empty. Add something tasty.</li>
              )}
              {lines.map((line) => { const { item, qty, mods } = line; const desc = describeMods(mods); return (
                <li key={line.key} className="flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-sm text-zinc-500">{money(item.price)}</p>
                    {desc && <p className="mt-0.5 line-clamp-2 text-xs text-brand">{desc}</p>}
                    <button onClick={() => openItem(item, line)} className="mt-1 text-xs font-semibold text-zinc-600 underline hover:text-brand">Edit</button>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-black/10 p-1">
                    <button onClick={() => dispatch({ type: "dec", key: line.key })} aria-label="Remove one" className="grid h-7 w-7 place-items-center rounded-full hover:bg-zinc-100">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm">{qty}</span>
                    <button onClick={() => dispatch({ type: "inc", key: line.key })} aria-label="Add one" className="grid h-7 w-7 place-items-center rounded-full hover:bg-zinc-100">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-16 text-right font-semibold">{money(item.price * qty)}</span>
                </li>
              )})}
            </ul>
            <Totals subtotal={subtotal} tax={tax} total={total} />
            <div className="flex-none p-5 pt-0">
              <Button size="lg" className="w-full" disabled={count === 0} onClick={() => setStep("details")}>
                Continue to checkout
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-2 rounded-full border border-black/10 p-1">
                {(["pickup", "delivery"] as const).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setD({ ...d, method: m })}
                    className={cn(
                      "rounded-full py-2 text-sm font-semibold capitalize transition",
                      d.method === m ? "bg-brand text-white" : "text-zinc-600"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input required className={field} placeholder="Full name" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
              <input required type="tel" className={field} placeholder="Mobile number" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} />
              <input required type="email" className={field} placeholder="Email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
              {d.method === "delivery" ? (
                <input required className={field} placeholder="Delivery address" value={d.address ?? ""} onChange={(e) => setD({ ...d, address: e.target.value })} />
              ) : (
                <p className="rounded-xl bg-zinc-100 p-4 text-sm text-zinc-600">
                  Pick up at <span className="text-zinc-800">{INFO.address}</span>
                </p>
              )}
              <select className={field} value={d.when} onChange={(e) => setD({ ...d, when: e.target.value })}>
                <option value="asap">ASAP · about 30 mins</option>
                <option value="30">In 30 minutes</option>
                <option value="60">In 1 hour</option>
                <option value="90">In 90 minutes</option>
              </select>
              <textarea rows={3} className={cn(field, "h-auto py-3")} placeholder="Notes for the kitchen (optional)" value={d.notes ?? ""} onChange={(e) => setD({ ...d, notes: e.target.value })} />
            </div>
            <Totals subtotal={subtotal} tax={tax} total={total} />
            <div className="flex-none px-5 pb-3 text-sm">
              {error ? (
                <div className="rounded-xl bg-red-50 p-4 text-red-800">
                  <p className="font-semibold">We couldn't send your order online.</p>
                  <p className="mt-1">Your cart is saved. Please call us to place it:</p>
                  <a href={INFO.phoneHref} className="mt-2 inline-flex items-center gap-2 font-bold underline">
                    <Phone className="h-4 w-4" /> {INFO.phone}
                  </a>
                </div>
              ) : (
                <p className="text-zinc-500">You'll pay when you pick up or receive your order.</p>
              )}
            </div>
            <div className="flex flex-none gap-2 p-5 pt-0">
              <Button type="button" variant="outline" size="lg" onClick={() => setStep("cart")}>
                Back
              </Button>
              <Button type="submit" size="lg" className="flex-1" disabled={busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : `Place order · ${money(total)}`}
              </Button>
            </div>
          </form>
        )}
      </aside>
    </>
  );
}

function Totals({ subtotal, tax, total }: { subtotal: number; tax: number; total: number }) {
  return (
    <dl className="flex-none space-y-1.5 border-t border-black/10 p-5 text-sm">
      <div className="flex justify-between text-zinc-600"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
      <div className="flex justify-between text-zinc-600"><dt>Tax (6%)</dt><dd>{money(tax)}</dd></div>
      <div className="flex justify-between pt-1 text-lg font-bold"><dt>Total</dt><dd>{money(total)}</dd></div>
    </dl>
  );
}
