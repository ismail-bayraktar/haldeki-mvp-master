import { useState, useEffect } from "react";
import { Package, TrendingUp } from "lucide-react";

const OrderCounter = () => {
  // Simulated dynamic order count - in production this would come from API
  const [orderCounts, setOrderCounts] = useState({
    menemen: 127,
    aliaga: 89,
  });

  useEffect(() => {
    // Simulate live order updates every 30 seconds
    const interval = setInterval(() => {
      setOrderCounts((prev) => ({
        menemen: prev.menemen + Math.floor(Math.random() * 3),
        aliaga: prev.aliaga + Math.floor(Math.random() * 2),
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const totalToday = orderCounts.menemen + orderCounts.aliaga;

  return (
    <section className="py-6 bg-gradient-to-r from-primary to-haldeki-green-medium text-primary-foreground">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-white/10">
              <Package className="h-5 w-5" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-white/70">Bugün Teslim Edilen</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                {totalToday} Sipariş
                <TrendingUp className="h-4 w-4 text-white/70" />
              </p>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-white/20" />

          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <p className="text-white/70">Menemen</p>
              <p className="font-bold text-lg">{orderCounts.menemen}</p>
            </div>
            <div className="text-center">
              <p className="text-white/70">Aliağa</p>
              <p className="font-bold text-lg">{orderCounts.aliaga}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderCounter;
