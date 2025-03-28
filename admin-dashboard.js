/**
 * Service Marketplace Admin Dashboard
 * Provides specialized analytics and management capabilities for the marketplace
 */

// Chart colors with transparency
const chartColors = {
  blue: 'rgba(54, 162, 235, 1)',
  blueTransparent: 'rgba(54, 162, 235, 0.2)',
  green: 'rgba(75, 192, 192, 1)',
  greenTransparent: 'rgba(75, 192, 192, 0.2)',
  yellow: 'rgba(255, 206, 86, 1)',
  yellowTransparent: 'rgba(255, 206, 86, 0.2)',
  red: 'rgba(255, 99, 132, 1)',
  redTransparent: 'rgba(255, 99, 132, 0.2)',
  purple: 'rgba(153, 102, 255, 1)',
  purpleTransparent: 'rgba(153, 102, 255, 0.2)',
  orange: 'rgba(255, 159, 64, 1)',
  orangeTransparent: 'rgba(255, 159, 64, 0.2)',
  grey: 'rgba(201, 203, 207, 1)',
  greyTransparent: 'rgba(201, 203, 207, 0.2)'
};

// Chart instances
let revenueChart;
let categoryChart;
let satisfactionChart;

// Cache for API data
const dataCache = {
  analytics: null,
  experts: null,
  consultations: null,
  expiryTime: 5 * 60 * 1000, // 5 minutes
  lastFetched: null
};

// Date range settings
let dateRange = {
  start: new Date(new Date().setDate(new Date().getDate() - 30)),
  end: new Date(),
  displayText: 'Last 30 Days'
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
  initDateRangePicker();
  initTabNavigation();
  loadDashboardData();
});

// Initialize Flatpickr date range picker
function initDateRangePicker() {
  const dateRangeBtn = document.getElementById('dateRangeBtn');
  const dateRangePicker = document.getElementById('dateRangePicker');

  // Initialize flatpickr
  const picker = flatpickr(dateRangePicker, {
    mode: 'range',
    dateFormat: 'Y-m-d',
    defaultDate: [dateRange.start, dateRange.end],
    onClose: (selectedDates) => {
      if (selectedDates.length === 2) {
        dateRange.start = selectedDates[0];
        dateRange.end = selectedDates[1];

        // Calculate difference in days
        const diffTime = Math.abs(dateRange.end - dateRange.start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Update button text
        dateRange.displayText = `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)} (${diffDays} days)`;
        dateRangeBtn.innerHTML = `<i class="far fa-calendar-alt"></i> ${dateRange.displayText}`;

        // Reload data with new date range
        loadDashboardData();
      }
    }
  });

  // Open picker when button is clicked
  dateRangeBtn.addEventListener('click', () => {
    picker.toggle();
  });

  // Initialize refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    clearCache();
    loadDashboardData();
  });
}

// Format date to MMM dd, yyyy
function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Initialize tab navigation
function initTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Deactivate all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Activate clicked tab
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });

  // Initialize sidebar navigation
  const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Only handle links with data-tab attribute
      const tabName = link.getAttribute('data-tab');
      if (tabName) {
        e.preventDefault();

        // Update active state in sidebar
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Find and click the corresponding tab button
        const tabButton = document.querySelector(`.tab-btn[data-tab="${tabName}-tab"]`);
        if (tabButton) {
          tabButton.click();
        }
      }
    });
  });
}

// Load dashboard data
async function loadDashboardData() {
  showLoading(true);

  try {
    // Check if we have cached data that's still valid
    if (dataCache.analytics && dataCache.lastFetched &&
        (new Date() - dataCache.lastFetched < dataCache.expiryTime)) {
      renderDashboard(dataCache.analytics);
    } else {
      // Fetch fresh data
      const response = await fetch(`/api/analytics?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();

      // Cache the data
      dataCache.analytics = data;
      dataCache.lastFetched = new Date();

      renderDashboard(data);
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showError('Failed to load dashboard data. Please try again later.');
  } finally {
    showLoading(false);
  }
}

// Clear data cache
function clearCache() {
  dataCache.analytics = null;
  dataCache.experts = null;
  dataCache.consultations = null;
  dataCache.lastFetched = null;
}

// Show/hide loading indicator
function showLoading(isLoading) {
  document.getElementById('loadingIndicator').style.display = isLoading ? 'flex' : 'none';
  document.getElementById('dashboardContent').style.display = isLoading ? 'none' : 'block';
}

// Show error message
function showError(message) {
  // For now, we'll just use console.error
  // In a real application, we would show a toast or alert
  console.error(message);
}

// Render dashboard with data
function renderDashboard(data) {
  updateSummaryStats(data);
  initializeCharts(data);
  populateRecentConsultations(data);
  populateTopExperts(data);
}

// Update summary statistics
function updateSummaryStats(data) {
  // Revenue
  const totalRevenue = data.revenueData?.total || 0;
  document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);

  // Calculate revenue trend
  const lastPeriodRevenue = calculatePreviousPeriodValue(data.revenueData?.byMonth?.values || []);
  const revenueTrend = lastPeriodRevenue > 0 ?
    ((totalRevenue / lastPeriodRevenue - 1) * 100).toFixed(1) : 0;

  const revenueTrendEl = document.getElementById('revenueTrend');
  revenueTrendEl.textContent = `${revenueTrend > 0 ? '+' : ''}${revenueTrend}% vs last period`;
  revenueTrendEl.className = `trend ${revenueTrend >= 0 ? 'up' : 'down'}`;

  // Expert count
  const expertCount = data.expertPerformance?.length || 0;
  document.getElementById('activeExperts').textContent = expertCount;

  // For other metrics, we'll use mock trend data for now
  document.getElementById('expertsTrend').textContent = "+8.5% vs last period";
  document.getElementById('expertsTrend').className = "trend up";

  // Client count (we'll use the user stats from the general analytics)
  const clientCount = data.stats?.totalUsers || 0;
  document.getElementById('totalClients').textContent = clientCount;
  document.getElementById('clientsTrend').textContent = "+12.3% vs last period";
  document.getElementById('clientsTrend').className = "trend up";

  // Consultation count
  const consultationCount = data.stats?.totalMessages || 0;
  document.getElementById('totalConsultations').textContent = consultationCount;
  document.getElementById('consultationsTrend').textContent = "+5.7% vs last period";
  document.getElementById('consultationsTrend').className = "trend up";
}

// Calculate value for previous period to show trend
function calculatePreviousPeriodValue(values) {
  if (!values || values.length < 2) return 0;
  return values[values.length - 2] || 0;
}

// Format currency values
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Initialize dashboard charts
function initializeCharts(data) {
  initRevenueChart(data);
  initCategoryChart(data);
  initSatisfactionChart(data);
}

// Initialize revenue chart
function initRevenueChart(data) {
  const ctx = document.getElementById('revenueChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (revenueChart) {
    revenueChart.destroy();
  }

  // Get revenue data
  const revenueData = data.revenueData?.byMonth || { labels: [], values: [] };

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: revenueData.labels,
      datasets: [{
        label: 'Revenue',
        data: revenueData.values,
        borderColor: chartColors.blue,
        backgroundColor: chartColors.blueTransparent,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });

  // Add event listener for period select
  document.getElementById('revenuePeriodSelect')?.addEventListener('change', (e) => {
    const period = e.target.value;
    updateRevenueChartPeriod(period, data);
  });
}

// Update revenue chart based on selected period
function updateRevenueChartPeriod(period, data) {
  if (!revenueChart) return;

  let labels = [];
  let values = [];

  switch (period) {
    case 'daily':
      if (data.messageActivity?.daily) {
        labels = data.messageActivity.daily.timeLabels;
        // Convert message counts to revenue (mock data)
        values = data.messageActivity.daily.messageData.map(val => val * 75);
      }
      break;

    case 'weekly':
      if (data.messageActivity?.weekly) {
        labels = data.messageActivity.weekly.timeLabels;
        // Convert message counts to revenue (mock data)
        values = data.messageActivity.weekly.messageData.map(val => val * 75);
      }
      break;

    case 'monthly':
    default:
      if (data.revenueData?.byMonth) {
        labels = data.revenueData.byMonth.labels;
        values = data.revenueData.byMonth.values;
      }
      break;
  }

  revenueChart.data.labels = labels;
  revenueChart.data.datasets[0].data = values;
  revenueChart.update();
}

// Initialize category distribution chart
function initCategoryChart(data) {
  const ctx = document.getElementById('categoryChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (categoryChart) {
    categoryChart.destroy();
  }

  // Get category data
  const categoryData = data.revenueData?.byCategory || {};
  const labels = Object.keys(categoryData);
  const values = Object.values(categoryData);

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          chartColors.blue,
          chartColors.green,
          chartColors.yellow,
          chartColors.red,
          chartColors.purple
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Initialize client satisfaction chart
function initSatisfactionChart(data) {
  const ctx = document.getElementById('satisfactionChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (satisfactionChart) {
    satisfactionChart.destroy();
  }

  // Get satisfaction data
  const satisfactionData = data.clientSatisfaction?.categories || {
    'Consultation Quality': 4.8,
    'Expert Knowledge': 4.9,
    'Response Time': 4.5,
    'Value for Money': 4.6,
    'Platform Experience': 4.7
  };

  const labels = Object.keys(satisfactionData);
  const values = Object.values(satisfactionData);

  satisfactionChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Satisfaction Rating',
        data: values,
        backgroundColor: chartColors.blueTransparent,
        borderColor: chartColors.blue,
        pointBackgroundColor: chartColors.blue,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// Populate recent consultations table
function populateRecentConsultations(data) {
  const tableBody = document.getElementById('recentConsultationsTable');
  if (!tableBody) return;

  // Clear existing rows
  tableBody.innerHTML = '';

  // Get mock consultation data (in a real app, this would come from the API)
  const consultations = getMockConsultations();

  // Add rows to table
  consultations.forEach(consultation => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${consultation.expert}</td>
      <td>${consultation.client}</td>
      <td>${consultation.category}</td>
      <td>${consultation.date}</td>
      <td>${formatCurrency(consultation.revenue)}</td>
      <td><span class="status ${consultation.status.toLowerCase()}">${consultation.status}</span></td>
    `;

    tableBody.appendChild(row);
  });
}

// Populate top experts table
function populateTopExperts(data) {
  const tableBody = document.getElementById('topExpertsTable');
  if (!tableBody) return;

  // Clear existing rows
  tableBody.innerHTML = '';

  // Get expert data
  const experts = data.expertPerformance || [];

  // Sort experts based on selected metric
  const metricSelect = document.getElementById('expertMetricSelect');
  const sortMetric = metricSelect ? metricSelect.value : 'revenue';

  // Sort experts by selected metric
  const sortedExperts = [...experts].sort((a, b) => {
    if (sortMetric === 'revenue') {
      return b.revenue - a.revenue;
    } else if (sortMetric === 'consultations') {
      return b.consultations - a.consultations;
    } else if (sortMetric === 'rating') {
      return b.rating - a.rating;
    }
    return 0;
  });

  // Add rows to table
  sortedExperts.forEach(expert => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${expert.name}</td>
      <td>${expert.category}</td>
      <td>${expert.consultations}</td>
      <td>${formatCurrency(expert.revenue)}</td>
      <td>${expert.rating.toFixed(1)} ⭐</td>
      <td><span class="status active">Active</span></td>
    `;

    tableBody.appendChild(row);
  });

  // Add event listener for metric select
  metricSelect?.addEventListener('change', () => {
    populateTopExperts(data);
  });
}

// Get mock consultations data
function getMockConsultations() {
  return [
    {
      expert: 'Dr. Sarah Johnson',
      client: 'Jennifer A.',
      category: 'Nutrition',
      date: '2023-03-15',
      revenue: 90,
      status: 'Completed'
    },
    {
      expert: 'Thomas Wright, Esq.',
      client: 'Michael T.',
      category: 'Legal',
      date: '2023-03-14',
      revenue: 150,
      status: 'Completed'
    },
    {
      expert: 'Maria Garcia, CFA',
      client: 'Robert K.',
      category: 'Financial',
      date: '2023-03-14',
      revenue: 120,
      status: 'Pending'
    },
    {
      expert: 'Dr. James Wilson',
      client: 'Sophia L.',
      category: 'Medical',
      date: '2023-03-13',
      revenue: 180,
      status: 'Completed'
    },
    {
      expert: 'Alex Chen',
      client: 'David P.',
      category: 'Technical',
      date: '2023-03-13',
      revenue: 75,
      status: 'Pending'
    }
  ];
}
