import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { thumb } from "@/data/menu";
import { ADDONS, INGREDIENTS, REQUESTS, categoryOf } from "@/data/customizations";
import { cn, money } from "@/lib/utils";
import { lockScroll } from "@/hooks/use-smooth-scroll";

function Chip({ on, onClick, children, danger }: { on: boolean; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        on
          ? danger
            ? "border-brand bg-brand text-white line-through decoration-white/70"
            : "border-brand bg-brand text-white"
          : "border-black/15 text-zinc-700 hover:border-black/40"
      )}
    >
      {children}
    </button>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="font-bold">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-zinc-500">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

export function ItemModal() {
  const { customizing, closeItem, dispatch } = useCart();
  if (!customizing) return null;
  // remount per item/line so state always starts from the right values
  return <Sheet key={customizing.line?.key ?? customizing.item.id} />;
}

function Sheet() {
  const { customizing, closeItem, dispatch } = useCart();
  const { item, line } = customizing!;
  const cat = categoryOf(item);

  const known = INGREDIENTS[item.name] ?? [];
  const requests = REQUESTS[cat] ?? [];
  const addons = ADDONS[cat] ?? [];

  const [removed, setRemoved] = useState<string[]>(line?.mods.removed ?? []);
  const [extras, setExtras] = useState<string[]>(line?.mods.extras ?? []);
  const [note, setNote] = useState(line?.mods.note ?? "");
  const [qty, setQty] = useState(line?.qty ?? 1);
  const [custom, setCustom] = useState("");

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const removable = useMemo(() => Array.from(new Set([...known, ...removed])), [known, removed]);
  const addCustom = () => {
    const v = custom.trim();
    if (v && !removed.some((r) => r.toLowerCase() === v.toLowerCase())) setRemoved([...removed, v]);
    setCustom("");
  };

  useEffect(() => {
    lockScroll(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeItem();
    window.addEventListener("keydown", onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [closeItem]);

  const save = () => {
    const mods = { removed, extras, note: note.trim() };
    if (line) dispatch({ type: "replace", oldKey: line.key, item, mods, qty });
    else dispatch({ type: "add", item, mods, qty });
    closeItem();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="absolute inset-0 bg-black/60" onClick={closeItem} />
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <button onClick={closeItem} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow hover:bg-white">
          <X className="h-5 w-5" />
        </button>

        <div data-lenis-prevent className="overflow-y-auto overscroll-contain">
          {item.image && (
            <img src={item.image} alt={item.name} width={800} height={500} className="aspect-[16/10] w-full object-cover" decoding="async" />
          )}
          <div className="p-6 pt-5">
            <div className="flex items-start justify-between gap-4 pr-8">
              <h2 className="text-2xl font-extrabold leading-tight">{item.name}</h2>
              <span className="text-xl font-bold text-brand">{money(item.price)}</span>
            </div>
            {item.desc && <p className="mt-2 text-zinc-600">{item.desc}</p>}

            {removable.length > 0 && (
              <Group title="Remove ingredients" hint="Tap anything you don't want on it.">
                {removable.map((r) => (
                  <Chip key={r} on={removed.includes(r)} danger onClick={() => toggle(removed, setRemoved, r)}>
                    {r}
                  </Chip>
                ))}
              </Group>
            )}

            <section className="mt-6">
              <h3 className="font-bold">{removable.length ? "Remove something else?" : "Remove anything?"}</h3>
              <p className="mt-0.5 text-sm text-zinc-500">Type it in, like “onions” or “pickles”.</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
                  maxLength={40}
                  placeholder="e.g. no pickles"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-black/10 bg-zinc-50 px-4 text-sm outline-none focus:border-brand"
                />
                <button type="button" onClick={addCustom} className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-black">
                  Remove
                </button>
              </div>
              {removed.filter((r) => !known.includes(r)).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {removed.filter((r) => !known.includes(r)).map((r) => (
                    <Chip key={r} on danger onClick={() => setRemoved(removed.filter((x) => x !== r))}>
                      {r} ✕
                    </Chip>
                  ))}
                </div>
              )}
            </section>

            {addons.length > 0 && (
              <Group title="Add extras" hint="The restaurant confirms any extra charge when it confirms your order.">
                {addons.map((a) => (
                  <Chip key={a} on={extras.includes(a)} onClick={() => toggle(extras, setExtras, a)}>
                    {a}
                  </Chip>
                ))}
              </Group>
            )}

            {requests.length > 0 && (
              <Group title="Make it your way">
                {requests.map((r) => (
                  <Chip key={r} on={extras.includes(r)} onClick={() => toggle(extras, setExtras, r)}>
                    {r}
                  </Chip>
                ))}
              </Group>
            )}

            <section className="mt-6">
              <h3 className="font-bold">Special instructions</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="Anything else the kitchen should know?"
                className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-brand"
              />
              <p className="mt-1 text-xs text-zinc-500">For allergies, please also call the restaurant.</p>
            </section>
          </div>
        </div>

        <div className="flex flex-none items-center gap-3 border-t border-black/10 bg-white p-4">
          <div className="flex items-center gap-2 rounded-full border border-black/10 p-1">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Fewer" className="grid h-9 w-9 place-items-center rounded-full hover:bg-zinc-100">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center font-semibold">{qty}</span>
            <button onClick={() => setQty(Math.min(20, qty + 1))} aria-label="More" className="grid h-9 w-9 place-items-center rounded-full hover:bg-zinc-100">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button onClick={save} className="h-12 flex-1 rounded-full bg-brand font-bold text-white transition hover:bg-brand-dark active:scale-[0.98]">
            {line ? "Update order" : "Add to order"} · {money(item.price * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}
