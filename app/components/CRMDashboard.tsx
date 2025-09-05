import { Page, Card, Text, BlockStack, InlineStack, Icon } from '@shopify/polaris';
import {
  CartIcon,
  CashDollarIcon,
  DeliveryIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  ChartVerticalIcon,
  OrderIcon,
  ChartDonutIcon,
  ChartLineIcon,
  ChartHistogramGrowthIcon
} from '@shopify/polaris-icons';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  padding: 24px;
  background: #f6f6f7;
  min-height: 100vh;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`;

const MetricCard = styled(Card)`
  height: 120px;
  
  .Polaris-Card__Content {
    height: 100%;
    padding: 16px;
  }
`;

const ChartCard = styled(Card)`
  height: 300px;
  
  .Polaris-Card__Content {
    height: 100%;
    padding: 20px;
  }
`;

const MetricContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
`;

const MetricLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
`;

const MetricRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const MetricValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: #202223;
  line-height: 1;
`;

const TrendIndicator = styled.div<{ trend: 'up' | 'down' | 'neutral' }>`
  font-size: 14px;
  color: ${props => 
    props.trend === 'up' ? '#008060' :
    props.trend === 'down' ? '#d72c0d' : '#6d7175'
  };
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 200px;
  // padding: 16px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;


const DonutChartContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  width: 100%;
`;

const DonutChart = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    #4a90e2 0deg 252deg,
    #e74c3c 252deg 360deg
  );
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: white;
    border-radius: 50%;
  }
`;

const ChartLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LegendColor = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  background: ${props => props.color};
  border-radius: 2px;
`;

export default function CRMDashboard() {
  // Hard-coded variable to switch between modes
  const DATA_MODE = 'real';
  // const DATA_MODE = 'dummy';
  // Generate last 5 months dynamically
  const getLast5Months = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentDate = new Date();
    const last5Months = [];
    
    for (let i = 4; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      last5Months.push({
        label: months[monthIndex],
        value: Math.floor(Math.random() * 2000) + 1500 // Random values between 1500-3500
      });
    }
    
    return last5Months;
  };

  const renderChart = (chart: any) => {
    switch (chart.type) {
      case 'line':
        const maxValue = Math.max(...chart.data);
        const minValue = Math.min(...chart.data);
        const valueRange = maxValue - minValue || 1;
        
        const points = chart.data.map((value: number, index: number) => {
          const x = 55 + (index / (chart.data.length - 1)) * 170;
          const y = 20 + ((maxValue - value) / valueRange) * 120;
          return `${x},${y}`;
        }).join(' ');

        const yLabels = [];
        for (let i = 0; i <= 4; i++) {
          const value = Math.round(minValue + (valueRange * i / 4));
          const y = 140 - (i * 30);
          yLabels.push({ value, y });
        }

        const monthLabels = getLast5Months();
        
        return (
          <ChartContainer>
            <svg width="100%" height="100%" viewBox="0 0 250 160">
              {yLabels.map((label, index) => (
                <text key={index} x="35" y={label.y + 4} textAnchor="end" fontSize="10" fill="#6d7175">
                  {label.value}
                </text>
              ))}
              {chart.data.map((value: number, index: number) => {
                const x = 55 + (index / (chart.data.length - 1)) * 170;
                return (
                  <text key={index} x={x} y="155" textAnchor="middle" fontSize="10" fill="#6d7175">
                    {monthLabels[index]?.label || `M${index + 1}`}
                  </text>
                );
              })}
              <polyline
                fill="none"
                stroke="#4a90e2"
                strokeWidth="3"
                points={points}
              />
              {chart.data.map((value: number, index: number) => {
                const x = 55 + (index / (chart.data.length - 1)) * 170;
                const y = 20 + ((maxValue - value) / valueRange) * 120;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#4a90e2"
                  />
                );
              })}
            </svg>
          </ChartContainer>
        );
      
      case 'bar':
        const maxBarValue = Math.max(...chart.data.map((d: any) => d.value));
        
        return (
          <ChartContainer>
            <svg width="100%" height="100%" viewBox="0 0 300 160">
              {chart.data.map((bar: any, index: number) => {
                const x = 50 + index * 45;
                const barHeight = (bar.value / maxBarValue) * 120;
                const y = 120 - barHeight;
                return (
                  <g key={index}>
                    <rect
                      x={x}
                      y={y}
                      width="35"
                      height={barHeight}
                      fill="#4a90e2"
                      rx="3"
                    />
                    <text x={x + 17.5} y="140" textAnchor="middle" fontSize="12" fill="#6d7175">
                      {bar.label}
                    </text>
                  </g>
                );
              })}
              {[0, 1, 2, 3, 4].map(i => {
                const value = Math.round((maxBarValue * i / 4));
                const y = 120 - (i * 30);
                if (value === 0) return null;
                return (
                  <text key={i} x="40" y={y + 4} textAnchor="end" fontSize="12" fill="#6d7175">
                    {value}
                  </text>
                );
              })}
            </svg>
          </ChartContainer>
        );
      
      case 'donut':
        return (
          <ChartContainer>
            <DonutChartContainer>
              <DonutChart />
              <ChartLegend>
                {chart.data.map((item: any, index: number) => (
                  <LegendItem key={index}>
                    <LegendColor color={item.color} />
                    <span>{item.label}: {item.value}%</span>
                  </LegendItem>
                ))}
              </ChartLegend>
            </DonutChartContainer>
          </ChartContainer>
        );
      
      default:
        return <div>Chart type not supported</div>;
    }
  };

  const getDummyMetricsData = () => [
    {
      title: 'Pedidos por confirmar',
      value: '8',
      trend: 'up' as const,
      trendValue: '35%',
      icon: CartIcon
    },
    {
      title: 'Facturación por confirmar',
      value: '275,00 €',
      trend: 'up' as const,
      trendValue: '+12%',
      icon: ChartVerticalIcon
    },
    {
      title: 'Facturación en tránsito',
      value: '0,00 €',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: DeliveryIcon
    },
    {
      title: 'Facturado Total',
      value: '275,00 €',
      trend: 'up' as const,
      trendValue: '+18%',
      icon: CashDollarIcon
    },
    {
      title: 'Dinero Incidencias',
      value: '0,00 €',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: AlertTriangleIcon
    },
    {
      title: 'Incidencias',
      value: '0',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: RefreshIcon
    }
  ];

  const getRealMetricsData = () => [
    {
      title: 'Pedidos por confirmar',
      value: '0',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: CartIcon
    },
    {
      title: 'Facturación por confirmar',
      value: '0,00 €',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: ChartVerticalIcon
    },
    {
      title: 'Facturación en tránsito',
      value: '0,00 €',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: DeliveryIcon
    },
    {
      title: 'Facturado Total',
      value: '1250,75 €', // Test value
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: CashDollarIcon
    },
    {
      title: 'Dinero Incidencias',
      value: '0,00 €',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: AlertTriangleIcon
    },
    {
      title: 'Incidencias',
      value: '0',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: RefreshIcon
    }
  ];

  const metricsData = DATA_MODE === 'dummy' ? getDummyMetricsData() : getRealMetricsData();

  const last5Months = getLast5Months();

  const chartsData = [
    {
      title: 'Pedidos totales histórico',
      icon: ChartLineIcon,
      type: 'line',
      data: [12, 19, 25, 23, 42]
    },
    {
      title: 'Facturación',
      icon: ChartHistogramGrowthIcon,
      type: 'bar',
      data: last5Months.map(month => ({
        label: month.label,
        value: month.value
      }))
    },
    {
      title: 'Pedidos entregados / Rechazados',
      icon: ChartDonutIcon,
      type: 'donut',
      data: [
        { label: 'Entregados', value: 70, color: '#4a90e2' },
        { label: 'Rechazados', value: 30, color: '#e74c3c' }
      ]
    }
  ];

  return (
    <Page title="Panel de Control">
      <DashboardContainer>
        <MetricsGrid>
          {metricsData.map((metric, index) => (
            <MetricCard key={index}>
              <MetricContent>
                <MetricLeft>
                  <Text as="p" variant="bodyMd" color="subdued">
                    {metric.title}
                  </Text>
                  <MetricValue>{metric.value}</MetricValue>
                </MetricLeft>
                <MetricRight>
                  <Icon source={metric.icon} tone="base" />
                  <TrendIndicator trend={metric.trend}>
                    {metric.trendValue}
                  </TrendIndicator>
                </MetricRight>
              </MetricContent>
            </MetricCard>
          ))}
        </MetricsGrid>

        <ChartsGrid>
          {chartsData.map((chart, index) => (
            <ChartCard key={index}>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h3" variant="headingMd">
                    {chart.title}
                  </Text>
                  <div style={{display: 'flex', justifyContent: 'center'}}>
                    <Icon source={chart.icon} tone="base" />
                  </div>
                </InlineStack>
                {renderChart(chart)}
              </BlockStack>
            </ChartCard>
          ))}
        </ChartsGrid>
      </DashboardContainer>
    </Page>
  );
}