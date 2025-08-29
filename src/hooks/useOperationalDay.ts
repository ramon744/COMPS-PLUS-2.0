import { useMemo } from "react";

export function useOperationalDay() {
  const getBrazilTime = () => {
    // Get current time in Brazil timezone
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  };

  const currentOperationalDay = useMemo(() => {
    const brazilTime = getBrazilTime();
    
    // If it's before 5 AM, it belongs to the previous operational day
    if (brazilTime.getHours() < 5) {
      const previousDay = new Date(brazilTime);
      previousDay.setDate(previousDay.getDate() - 1);
      // Format as YYYY-MM-DD using Brazil timezone
      const year = previousDay.getFullYear();
      const month = String(previousDay.getMonth() + 1).padStart(2, '0');
      const day = String(previousDay.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Format as YYYY-MM-DD using Brazil timezone
    const year = brazilTime.getFullYear();
    const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
    const day = String(brazilTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const formatOperationalDayDisplay = (date: string) => {
    const [year, month, day] = date.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Operational day runs from 05:00 of startDate to 04:59:59 of the next day
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    return `${formatDate(startDate)} às ${formatDate(endDate)}`;
  };

  const getCurrentTurn = () => {
    const brazilTime = getBrazilTime();
    const hour = brazilTime.getHours();
    
    return (hour >= 5 && hour < 17) ? "manha" : "noite";
  };

  const getBrazilTimeString = () => {
    return getBrazilTime().toISOString();
  };

  return {
    currentOperationalDay,
    formatOperationalDayDisplay,
    getCurrentTurn,
    getBrazilTimeString,
  };
}