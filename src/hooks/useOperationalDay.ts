import { useMemo } from "react";

export function useOperationalDay() {
  const getBrazilTime = () => {
    const now = new Date();
    // Convert to Brazil time (UTC-3)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brazilTime = new Date(utc + (-3 * 3600000));
    return brazilTime;
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
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    return `${formatDate(startDate)} a ${formatDate(endDate)}`;
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