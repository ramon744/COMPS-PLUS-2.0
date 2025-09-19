import React, { forwardRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PDFReportProps {
  reportData: any[];
  typeData: any[];
  waiterRanking: any[];
  managerRanking: any[];
  filters: {
    startDate: string;
    endDate: string;
    reportType: string;
    selectedType: string;
  };
  totalValue: number;
  totalQuantity: number;
  averageValue: number;
  formatCurrency: (value: number) => string;
  compTypes: any[];
}

const PDFReport = forwardRef<HTMLDivElement, PDFReportProps>(({
  reportData,
  typeData,
  waiterRanking,
  managerRanking,
  filters,
  totalValue,
  totalQuantity,
  averageValue,
  formatCurrency,
  compTypes
}, ref) => {
  const getReportTypeLabel = (reportType: string): string => {
    switch (reportType) {
      case 'diario': return 'Diário';
      case 'semanal': return 'Semanal';
      case 'mensal': return 'Mensal';
      case 'personalizado': return 'Personalizado';
      default: return reportType;
    }
  };

  const getColorByIndex = (index: number) => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', 
      '#00ff00', '#ff00ff', '#00ffff', '#ffff00'
    ];
    return colors[index % colors.length];
  };

  return (
    <div ref={ref} style={{ 
      fontFamily: 'Arial, sans-serif', 
      fontSize: '12px', 
      lineHeight: '1.4',
      color: '#333',
      backgroundColor: 'white',
      padding: '20px',
      maxWidth: '210mm',
      margin: '0 auto'
    }}>
      {/* Cabeçalho */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        borderBottom: '2px solid #2563eb',
        paddingBottom: '20px'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#2563eb',
          margin: '0 0 10px 0'
        }}>
          Relatório de COMPs
        </h1>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p style={{ margin: '5px 0' }}>
            <strong>Período:</strong> {format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: ptBR })} a {format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Tipo de Relatório:</strong> {getReportTypeLabel(filters.reportType)}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Tipo de COMP:</strong> {filters.selectedType === 'all' ? 'Todos' : compTypes.find(t => t.id === filters.selectedType)?.codigo || 'N/A'}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Gerado em:</strong> {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b' }}>Total do Período</h3>
          <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div style={{ 
          backgroundColor: '#f0fdf4', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b' }}>Quantidade Total</h3>
          <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>
            {totalQuantity}
          </p>
        </div>
        <div style={{ 
          backgroundColor: '#fefce8', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #fde047',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b' }}>Média por COMP</h3>
          <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#ca8a04' }}>
            {formatCurrency(averageValue)}
          </p>
        </div>
      </div>

      {/* Gráfico de Evolução */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '15px',
          color: '#1e293b',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '5px'
        }}>
          Evolução dos COMPs
        </h2>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dia" 
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), "Valor"]}
                labelFormatter={(label) => `Dia: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficos lado a lado */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {/* Distribuição por Tipo */}
        <div>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: '15px',
            color: '#1e293b'
          }}>
            Distribuição por Tipo
          </h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorByIndex(index)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking por Tipo */}
        <div>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: '15px',
            color: '#1e293b'
          }}>
            Ranking por Tipo
          </h3>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {typeData.map((type, index) => (
              <div key={type.name} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    backgroundColor: '#e2e8f0', 
                    color: '#64748b',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    #{index + 1}
                  </span>
                  <span style={{ fontWeight: '500' }}>{type.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0', fontWeight: 'bold' }}>{formatCurrency(type.value)}</p>
                  <p style={{ margin: '0', fontSize: '10px', color: '#64748b' }}>
                    {type.quantidade} ocorrências
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranking de Funcionários */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '15px',
          color: '#1e293b',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '5px'
        }}>
          Ranking de Funcionários
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '10px' 
        }}>
          {waiterRanking.slice(0, 6).map((waiter, index) => (
            <div key={waiter.id} style={{ 
              backgroundColor: '#f8fafc', 
              padding: '12px', 
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ 
                  backgroundColor: '#2563eb', 
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  #{index + 1}
                </span>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{waiter.name}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                <p style={{ margin: '2px 0' }}>Matrícula: {waiter.matricula || 'N/A'}</p>
                <p style={{ margin: '2px 0' }}>COMPs: {waiter.totalCount}</p>
                <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#16a34a' }}>
                  Total: {formatCurrency(waiter.totalValue)}
                </p>
                <p style={{ margin: '2px 0' }}>
                  Média: {formatCurrency(waiter.averageValue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking de Gerentes */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '15px',
          color: '#1e293b',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '5px'
        }}>
          Ranking de Gerentes
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '10px' 
        }}>
          {managerRanking.slice(0, 6).map((manager, index) => (
            <div key={manager.id} style={{ 
              backgroundColor: '#f8fafc', 
              padding: '12px', 
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ 
                  backgroundColor: '#dc2626', 
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  #{index + 1}
                </span>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{manager.name}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                <p style={{ margin: '2px 0' }}>Email: {manager.usuario}</p>
                <p style={{ margin: '2px 0' }}>COMPs: {manager.totalCount}</p>
                <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#dc2626' }}>
                  Total: {formatCurrency(manager.totalValue)}
                </p>
                <p style={{ margin: '2px 0' }}>
                  Média: {formatCurrency(manager.averageValue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <div style={{ 
        marginTop: '40px', 
        paddingTop: '20px', 
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
        fontSize: '10px',
        color: '#64748b'
      }}>
        <p>Relatório gerado automaticamente pelo sistema COMPs Plus</p>
        <p>Para mais informações, acesse o sistema de gestão</p>
      </div>
    </div>
  );
});

PDFReport.displayName = 'PDFReport';

export default PDFReport;
