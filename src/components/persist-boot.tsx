import { useEffect } from "react";
import { useHumanis } from "@/lib/store";

export function PersistBoot() {
  useEffect(() => {
    const done = () => useHumanis.getState().setHydrated(true);
    const result = useHumanis.persist.rehydrate();
    if (result && typeof (result as Promise<void>).then === "function") {
      void (result as Promise<void>).then(done, done);
    } else {
      done();
    }
  }, []);
  return null;
}
