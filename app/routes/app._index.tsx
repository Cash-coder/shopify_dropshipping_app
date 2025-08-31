import type { LoaderFunctionArgs } from "@remix-run/node";
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
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

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
  padding: 16px;
  position: relative;
`;

const LineChart = styled.svg`
  width: 100%;
  height: 100%;
  border-bottom: 2px solid #e1e3e5;
  border-left: 2px solid #e1e3e5;
`;

const LineChartContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  padding: 16px;
`;

const BarChart = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: end;
  gap: 8px;
  border-bottom: 2px solid #e1e3e5;
  border-left: 2px solid #e1e3e5;
  padding: 8px;
`;

const Bar = styled.div<{ height: string }>`
  flex: 1;
  height: ${props => props.height};
  background: #4a90e2;
  border-radius: 4px 4px 0 0;
  min-height: 10px;
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
    #27ae60 0deg 252deg,
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

export default function Index() {
  const renderChart = (chart: any) => {
    switch (chart.type) {
      case 'line':
        const maxValue = Math.max(...chart.data);
        const points = chart.data.map((value: number, index: number) => {
          const x = (index / (chart.data.length - 1)) * 280;
          const y = 140 - ((value / maxValue) * 120);
          return `${x},${y}`;
        }).join(' ');

        return (
          <ChartContainer>
            <LineChartContainer>
              <LineChart viewBox="0 0 300 160">
                <polyline
                  fill="none"
                  stroke="#4a90e2"
                  strokeWidth="3"
                  points={points}
                />
                {chart.data.map((value: number, index: number) => {
                  const x = (index / (chart.data.length - 1)) * 280;
                  const y = 140 - ((value / maxValue) * 120);
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#4a90e2"
                    />
                  );
                })}
              </LineChart>
            </LineChartContainer>
          </ChartContainer>
        );
      
      case 'bar':
        return (
          <ChartContainer>
            <BarChart>
              {chart.data.map((bar: any, index: number) => (
                <Bar 
                  key={index}
                  height={`${(bar.value / 3500) * 100}%`}
                />
              ))}
            </BarChart>
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

  const metricsData = [
    {
      title: 'Pedidos por confirmar',
      value: '8',
      trend: 'neutral' as const,
      trendValue: '0%',
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
      trend: 'down' as const,
      trendValue: '-5%',
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

  const chartsData = [
    {
      title: 'Pedidos totales histórico',
      icon: ChartLineIcon,
      type: 'line',
      data: [12, 19, 25, 32, 28, 35, 42]
    },
    {
      title: 'Facturación',
      icon: ChartHistogramGrowthIcon,
      type: 'bar',
      data: [
        { label: 'Ene', value: 2500 },
        { label: 'Feb', value: 1800 },
        { label: 'Mar', value: 3200 },
        { label: 'Abr', value: 2100 },
        { label: 'May', value: 2800 }
      ]
    },
    {
      title: 'Pedidos entregados / Rechazados',
      icon: ChartDonutIcon,
      type: 'donut',
      data: [
        { label: 'Entregados', value: 70, color: '#27ae60' },
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