import { Page, Card, Text, BlockStack, InlineStack, Icon } from '@shopify/polaris';
import {
  CartIcon,
  CashDollarIcon,
  DeliveryIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  ChartVerticalIcon,
  OrderIcon
} from '@shopify/polaris-icons';
import styled from 'styled-components';
import { useState, useEffect } from 'react';

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

const ChartPlaceholder = styled.div`
  width: 100%;
  height: 200px;
  background: #f6f6f7;
  border: 2px dashed #c9cccf;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6d7175;
  font-size: 16px;
`;

export default function CRMDashboard() {
  // Hard-coded variable to switch between modes
  const DATA_MODE = 'real';
  alert('DATA_MODE is: ' + DATA_MODE + ', comparison result: ' + (DATA_MODE === 'dummy'));

  const getDummyMetricsData = () => [
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
      icon: CashDollarIcon
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
      value: '400,00 €',
      trend: 'up' as const,
      trendValue: '+18%',
      icon: CheckCircleIcon
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
      icon: CashDollarIcon
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
      icon: CheckCircleIcon
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

  const chartsData = [
    {
      title: 'Pedidos totales histórico',
      icon: ChartVerticalIcon
    },
    {
      title: 'Facturación',
      icon: ChartVerticalIcon
    },
    {
      title: 'Pedidos entregados / Rechazados',
      icon: OrderIcon
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
                  <Icon source={chart.icon} tone="base" />
                </InlineStack>
                <ChartPlaceholder>
                  Gráfico - {chart.title}
                </ChartPlaceholder>
              </BlockStack>
            </ChartCard>
          ))}
        </ChartsGrid>
      </DashboardContainer>
    </Page>
  );
}