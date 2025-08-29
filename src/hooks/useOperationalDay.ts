import { useMemo } from "react";

export function useOperationalDay() {
  const getBrazilTime = () => {
    // Use native JavaScript API for Brazil timezone (handles daylight saving automatically)
    const brazilTimeString = new Date().toLocaleString("en-CA", { 
      timeZone: "America/Sao_Paulo",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return new Date(brazilTimeString);
  };

  const currentOperationalDay = useMemo(() => {
    const brazilTime = getBrazilTime();
    
    // If it's before 5 AM, it belongs to the previous operational day
    if (brazilTime.getHours() < 5) {
      const previousDay = new Date(brazilTime);
      previousDay.setDate(previousDay.getDate() - 1);
      return previousDay.toISOString().split('T')[0];
    }
    
    return brazilTime.toISOString().split('T')[0];
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