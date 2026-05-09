"use client";
import { useEffect, useState } from "react";

export function MemoryLoader({ insert }: { insert: (data: any) => any }) {
  let [data, setData] = useState(false);
  useEffect(() => {
    let run = async () => {
      const res = await fetch("/api/memories");
      if (!res.ok) throw new Error("Failed to fetch memories");
      const data = await res.json();
      setData(data);
    };

    run();
    return () => {
      setData(false);
    };
  }, []);

  return <>{data && insert && insert(data)}</>;
}
