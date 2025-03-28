// ... existing code ... <add after the initializeCharts function>

// Initialize revenue charts and forecasting
function initializeRevenueCharts() {
  // Revenue Forecast Chart
  const revenueForecastCtx = document.getElementById('revenue-forecast-chart')?.getContext('2d');
  if (revenueForecastCtx) {
    revenueChart = new Chart(revenueForecastCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Historical Revenue',
            data: [],
            borderColor: chartColors.blue,
            backgroundColor: 'transparent',
            tension: 0.4
          },
          {
            label: 'Forecast (Base)',
            data: [],
            borderColor: chartColors.green,
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.4
          },
          {
            label: 'Forecast (Optimistic)',
            data: [],
            borderColor: chartColors.yellow,
            backgroundColor: 'transparent',
            borderDash: [3, 3],
            tension: 0.4
          },
          {
            label: 'Forecast (Conservative)',
            data: [],
            borderColor: chartColors.red,
            backgroundColor: 'transparent',
            borderDash: [2, 2],
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              // Include a dollar sign in the ticks
              callback: function(value, index, ticks) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  // Revenue by Category Chart
  const revenueByCategoryCtx = document.getElementById('revenue-by-category-chart')?.getContext('2d');
  if (revenueByCategoryCtx) {
    revenueByCategoryChart = new Chart(revenueByCategoryCtx, {
      type: 'doughnut',
      data: {
        labels: ['Nutrition', 'Legal', 'Financial', 'Medical', 'Technical'],
        datasets: [{
          data: [0, 0, 0, 0, 0],
          backgroundColor: [
            chartColors.green,
            chartColors.purple,
            chartColors.orange,
            chartColors.blue,
            chartColors.yellow
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                const percentage = Math.round((value / total) * 100);
                const formattedValue = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value);
                return `${label}: ${formattedValue} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  // Expert Revenue Chart
  const expertRevenueCtx = document.getElementById('expert-revenue-chart')?.getContext('2d');
  if (expertRevenueCtx) {
    expertRevenueChart = new Chart(expertRevenueCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Revenue Generated',
          data: [],
          backgroundColor: chartColors.blue,
          borderColor: 'transparent',
          borderWidth: 0,
          barThickness: 20,
          maxBarThickness: 30
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.x !== null) {
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(context.parsed.x);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  // Matching Effectiveness Chart
  const matchingEffectivenessCtx = document.getElementById('matching-effectiveness-chart')?.getContext('2d');
  if (matchingEffectivenessCtx) {
    matchingEffectivenessChart = new Chart(matchingEffectivenessCtx, {
      type: 'bar',
      data: {
        labels: ['Excellent', 'Good', 'Average', 'Poor', 'Failed'],
        datasets: [{
          label: 'Match Quality Distribution',
          data: [45, 30, 15, 8, 2],
          backgroundColor: [
            chartColors.green,
            chartColors.blue,
            chartColors.yellow,
            chartColors.orange,
            chartColors.red
          ],
          borderColor: 'transparent',
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }

  // Set up event listeners for revenue charts
  const forecastPeriodSelect = document.getElementById('forecast-period');
  if (forecastPeriodSelect) {
    forecastPeriodSelect.addEventListener('change', updateRevenueForecast);
  }

  const matchingPeriodSelect = document.getElementById('matching-period');
  if (matchingPeriodSelect) {
    matchingPeriodSelect.addEventListener('change', updateMatchingEffectiveness);
  }
}

// Call the initialize revenue charts function during initialization
document.addEventListener('DOMContentLoaded', () => {
  initializeRevenueCharts();
});

// Update revenue forecast chart
function updateRevenueForecast() {
  if (!revenueChart) return;

  const forecastPeriod = parseInt(document.getElementById('forecast-period')?.value || 3);

  // Get the historical revenue data (last 12 months)
  const historicalData = getHistoricalRevenueData();

  // Generate forecast data
  const forecastData = generateRevenueForecast(historicalData, forecastPeriod);

  // Create labels
  const historicalLabels = Array.from({ length: historicalData.length }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (historicalData.length - 1) + i);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  const forecastLabels = Array.from({ length: forecastPeriod }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() + i + 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  // Update chart
  revenueChart.data.labels = [...historicalLabels, ...forecastLabels];

  // Historical data with nulls for forecast part
  revenueChart.data.datasets[0].data = [
    ...historicalData,
    ...Array(forecastPeriod).fill(null)
  ];

  // Base forecast data with nulls for historical part
  revenueChart.data.datasets[1].data = [
    ...Array(historicalData.length - 1).fill(null),
    historicalData[historicalData.length - 1], // Connect with last historical point
    ...forecastData.base
  ];

  // Optimistic forecast
  revenueChart.data.datasets[2].data = [
    ...Array(historicalData.length - 1).fill(null),
    historicalData[historicalData.length - 1], // Connect with last historical point
    ...forecastData.optimistic
  ];

  // Conservative forecast
  revenueChart.data.datasets[3].data = [
    ...Array(historicalData.length - 1).fill(null),
    historicalData[historicalData.length - 1], // Connect with last historical point
    ...forecastData.conservative
  ];

  revenueChart.update('none');

  // Update forecast summary metrics
  updateForecastSummary(forecastData.base);
}

// Update the forecast summary values
function updateForecastSummary(baseForecasts) {
  const projectedRevenueElement = document.getElementById('projected-revenue');
  const growthRateElement = document.getElementById('growth-rate');
  const confidenceLevelElement = document.getElementById('confidence-level');

  if (!projectedRevenueElement || !growthRateElement || !confidenceLevelElement) return;

  // Get projected revenue (sum of next 3 months or fewer if forecast is shorter)
  const forecastSum = baseForecasts.slice(0, 3).reduce((acc, val) => acc + val, 0);

  // Format the projected revenue
  projectedRevenueElement.textContent = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(forecastSum);

  // Calculate growth rate
  const historicalData = getHistoricalRevenueData();
  const historicalSum = historicalData.slice(-3).reduce((acc, val) => acc + val, 0);
  const growthRate = (forecastSum - historicalSum) / historicalSum * 100;

  // Format growth rate
  const formattedGrowthRate = growthRate.toFixed(1) + '%';
  growthRateElement.textContent = formattedGrowthRate;

  // Show growth indicator
  const growthIndicator = projectedRevenueElement.nextElementSibling;
  if (growthIndicator) {
    growthIndicator.textContent = growthRate >= 0 ? `+${formattedGrowthRate}` : formattedGrowthRate;
    growthIndicator.className = `forecast-change ${growthRate >= 0 ? 'positive' : 'negative'}`;
  }

  // Determine confidence level based on data variance
  const variance = calculateVariance(historicalData);
  let confidenceLevel = 'Medium';
  if (variance < 0.1) {
    confidenceLevel = 'High';
  } else if (variance > 0.25) {
    confidenceLevel = 'Low';
  }

  confidenceLevelElement.textContent = confidenceLevel;
}

// Get historical revenue data
function getHistoricalRevenueData() {
  // Check if we have real data from the API
  if (analyticsData.revenueHistory && Array.isArray(analyticsData.revenueHistory)) {
    return analyticsData.revenueHistory;
  }

  // Otherwise, generate mock historical data
  // Start with base values that demonstrate seasonality and growth
  const baseValues = [
    25000, 27000, 30000, 32000, 35000, 40000,
    38000, 36000, 42000, 45000, 50000, 55000
  ];

  // Add some random variation
  return baseValues.map(value => {
    const variation = value * 0.1 * (Math.random() - 0.5);
    return Math.round(value + variation);
  });
}

// Generate revenue forecast data
function generateRevenueForecast(historicalData, months) {
  // Implement a simple forecasting model

  // Calculate the average growth rate from historical data
  const growthRates = [];
  for (let i = 1; i < historicalData.length; i++) {
    growthRates.push(historicalData[i] / historicalData[i-1]);
  }

  // Use the average of the last 3 growth rates
  const recentGrowthRates = growthRates.slice(-3);
  const avgGrowthRate = recentGrowthRates.reduce((acc, rate) => acc + rate, 0) / recentGrowthRates.length;

  // Calculate the base, optimistic, and conservative forecasts
  const lastValue = historicalData[historicalData.length - 1];

  const baseForecasts = [];
  const optimisticForecasts = [];
  const conservativeForecasts = [];

  let currentValue = lastValue;
  for (let i = 0; i < months; i++) {
    // Apply seasonality factor (simplified)
    const monthIndex = (new Date().getMonth() + i + 1) % 12;
    const seasonalityFactor = 1 + (monthIndex % 3 === 0 ? 0.05 : monthIndex % 3 === 1 ? -0.03 : 0.02);

    // Calculate forecasts with different growth assumptions
    currentValue = currentValue * avgGrowthRate * seasonalityFactor;
    baseForecasts.push(Math.round(currentValue));
    optimisticForecasts.push(Math.round(currentValue * (1 + 0.1)));
    conservativeForecasts.push(Math.round(currentValue * (1 - 0.1)));
  }

  return {
    base: baseForecasts,
    optimistic: optimisticForecasts,
    conservative: conservativeForecasts
  };
}

// Calculate variance in a dataset (for confidence level)
function calculateVariance(data) {
  const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
  const squaredDiffs = data.map(val => {
    const diff = val - mean;
    return diff * diff;
  });
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;

  // Return normalized variance
  return Math.sqrt(variance) / mean;
}

// Update revenue by category chart
function updateRevenueByCategoryChart() {
  if (!revenueByCategoryChart) return;

  // Check if we have real data
  if (analyticsData.revenueByCategoryData) {
    revenueByCategoryChart.data.datasets[0].data = [
      analyticsData.revenueByCategoryData.nutrition || 0,
      analyticsData.revenueByCategoryData.legal || 0,
      analyticsData.revenueByCategoryData.financial || 0,
      analyticsData.revenueByCategoryData.medical || 0,
      analyticsData.revenueByCategoryData.technical || 0
    ];
  } else {
    // Use mock data proportional to overall revenue
    const totalRevenue = analyticsData.stats.totalRevenue || 358125;
    revenueByCategoryChart.data.datasets[0].data = [
      Math.round(totalRevenue * 0.35), // Nutrition
      Math.round(totalRevenue * 0.25), // Legal
      Math.round(totalRevenue * 0.20), // Financial
      Math.round(totalRevenue * 0.15), // Medical
      Math.round(totalRevenue * 0.05)  // Technical
    ];
  }

  revenueByCategoryChart.update('none');
}

// Update expert revenue chart
function updateExpertRevenueChart() {
  if (!expertRevenueChart) return;

  // Use the experts data to populate the chart
  if (analyticsData.experts && analyticsData.experts.length > 0) {
    // Sort experts by revenue
    const sortedExperts = [...analyticsData.experts].sort((a, b) => b.revenue - a.revenue);

    // Take top 5 experts
    const topExperts = sortedExperts.slice(0, 5);

    // Update chart
    expertRevenueChart.data.labels = topExperts.map(expert => expert.name);
    expertRevenueChart.data.datasets[0].data = topExperts.map(expert => expert.revenue);
  } else {
    // Mock data
    expertRevenueChart.data.labels = [
      'Dr. Sarah Johnson',
      'James Williams, Esq.',
      'Michael Chen',
      'Dr. Emily Rodriguez',
      'Alex Thompson'
    ];
    expertRevenueChart.data.datasets[0].data = [4230, 5670, 3890, 3450, 2980];
  }

  expertRevenueChart.update('none');
}

// Update matching effectiveness chart
function updateMatchingEffectiveness() {
  if (!matchingEffectivenessChart) return;

  const matchingPeriod = parseInt(document.getElementById('matching-period')?.value || 30);

  // Adjust data based on the selected period
  // In a real app, this would come from the API
  let data;
  if (matchingPeriod === 30) {
    data = [45, 30, 15, 8, 2];
  } else if (matchingPeriod === 90) {
    data = [43, 32, 15, 7, 3];
  } else {
    data = [40, 35, 15, 6, 4];
  }

  matchingEffectivenessChart.data.datasets[0].data = data;
  matchingEffectivenessChart.update('none');
}

// Generate revenue insights
function generateRevenueInsights() {
  const insightsContainer = document.getElementById('revenue-insights-container');
  if (!insightsContainer) return;

  // Clear previous insights
  insightsContainer.innerHTML = '';

  // Get data for insights
  const historicalData = getHistoricalRevenueData();
  const lastThreeMonths = historicalData.slice(-3);
  const growthRate = (lastThreeMonths[2] - lastThreeMonths[0]) / lastThreeMonths[0] * 100;

  // Create insights based on data
  const insights = [];

  // Growth trend insight
  if (growthRate > 10) {
    insights.push({
      type: 'success',
      icon: 'chart-line',
      title: 'Strong Revenue Growth',
      content: `Revenue has grown by ${growthRate.toFixed(1)}% over the last 3 months.`,
      action: 'Expand Marketing'
    });
  } else if (growthRate < 0) {
    insights.push({
      type: 'alert',
      icon: 'arrow-down',
      title: 'Revenue Declining',
      content: `Revenue has decreased by ${Math.abs(growthRate).toFixed(1)}% over the last 3 months.`,
      action: 'Review Pricing Strategy'
    });
  } else {
    insights.push({
      type: 'info',
      icon: 'chart-bar',
      title: 'Stable Revenue',
      content: `Revenue has shown stable growth of ${growthRate.toFixed(1)}% over the last 3 months.`,
      action: 'Explore Growth Opportunities'
    });
  }

  // Category insight
  if (analyticsData.revenueByCategoryData || true) {
    // Use the category data (real or mock)
    insights.push({
      type: 'info',
      icon: 'chart-pie',
      title: 'Category Performance',
      content: 'Nutrition experts are generating the highest revenue at 35% of total revenue.',
      action: 'Optimize Category Balance'
    });
  }

  // Seasonal insight based on month
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 10 || currentMonth <= 1) {
    insights.push({
      type: 'warning',
      icon: 'calendar',
      title: 'Seasonal Trend',
      content: 'Holiday season approaching - historically a 15% increase in financial consultations.',
      action: 'Prepare Holiday Promotions'
    });
  } else if (currentMonth >= 5 && currentMonth <= 7) {
    insights.push({
      type: 'info',
      icon: 'sun',
      title: 'Summer Season',
      content: 'Summer months typically see 10% increase in nutrition consultations.',
      action: 'Focus Summer Campaigns'
    });
  }

  // Add the insights to the container
  insights.forEach(insight => {
    const card = document.createElement('div');
    card.className = `insight-card ${insight.type}`;
    card.innerHTML = `
      <i class="fas fa-${insight.icon}"></i>
      <div class="insight-content">
        <h3>${insight.title}</h3>
        <p>${insight.content}</p>
        <a href="#" class="insight-action">${insight.action}</a>
      </div>
    `;
    insightsContainer.appendChild(card);
  });
}
