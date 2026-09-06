"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AdminCleanupPage() {
  const [status, setStatus] = useState("Idle");

  const cleanupFakeEntries = async () => {
    setStatus("Cleaning up...");
    try {
      const { error, count } = await supabase
        .from('app_waitlist')
        .delete({ count: 'exact' })
        .gt('position', 4);

      if (error) throw error;
      setStatus(`Deleted ${count ?? 0} fake entries.`);
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-10 text-black dark:text-white bg-white dark:bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Admin Cleanup</h1>
      <button 
        onClick={cleanupFakeEntries}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        Run Cleanup Script
      </button>
      <p className="mt-4">{status}</p>
    </div>
  );
}
