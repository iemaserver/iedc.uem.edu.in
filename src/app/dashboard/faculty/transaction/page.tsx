"use client";

import { useState, useEffect } from "react";
import { TransactionsTable } from "@/components/dashboard/teacher/transaction/TransactionsTable";
import { StatusGraph } from "@/components/dashboard/teacher/transaction/StatusGraph";
import { GrowthGraph } from "@/components/dashboard/teacher/transaction/GrowthGraph";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { fetchTransactions } from "@/lib/api/teacherApi";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransac();
  }, []);

  const fetchTransac = async () => {
    setIsLoading(true);
    try {
     const response = await fetchTransactions({all: true});
     setTransactions(response.data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Failed to fetch transactions");
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-6">
        <Loader2 className="animate-spin text-[var(--first-color)]" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-[var(--first-color)]">Transaction Records</h1>
        <p className="text-sm md:text-base text-muted-foreground">Track and manage your transaction records</p>
      </div>
      <div className="w-full h-full min-w-0">
        <div className="flex flex-col w-full h-full gap-4 min-w-0">
          {/* Top section with two columns */}
          <div className="flex flex-col lg:flex-row w-full gap-4">
            <div className="w-full lg:w-1/3">
              <StatusGraph transactions={transactions} />
            </div>
            <div className="w-full lg:w-2/3">
              <GrowthGraph transactions={transactions} />
            </div>
          </div>
          
          {/* Bottom section */}
         
            <div className="w-full flex-1 rounded-lg min-h-[300px] overflow-hidden min-w-0">
              <TransactionsTable />
            </div>
          
        </div>
      </div>
    </div>
  );
}
