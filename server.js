// Netlify Serverless Function
exports.handler = async function(event, context) {
  try {
    // Parse path to determine API endpoint
    const path = event.path.replace('/.netlify/functions/server', '');
    console.log('API path:', path);

    // Handle different API endpoints
    if (path === '/api/analytics') {
      // Mock analytics data
      const days = event.queryStringParameters?.days || 30;

      // Return mock data since we might not have database connection
      const mockData = {
        stats: {
          totalUsers: 1247,
          totalMessages: 28653,
          newUsers: 124,
          activeUsers: 873,
          newMessages: 3254
        },
        messageActivity: {
          daily: {
            timeLabels: Array.from({ length: 30 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - 29 + i);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            messageData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 500 + 200))
          },
          weekly: {
            timeLabels: Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (11 * 7) + (i * 7));
              return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            }),
            messageData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 3000 + 1000))
          },
          monthly: {
            timeLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            messageData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 10000 + 5000))
          }
        },
        userGrowth: {
          timeLabels: Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - 11 + i);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }),
          userData: Array.from({ length: 12 }, (_, i) => 100 + i * 100 + Math.floor(Math.random() * 50))
        },
        activityByTime: {
          timeLabels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
          activityData: [120, 85, 45, 356, 478, 512, 389, 240]
        },
        engagement: {
          messages: {
            label: 'Messages per User',
            labels: ['1-5', '6-10', '11-20', '21-50', '51+'],
            values: [432, 328, 276, 189, 22]
          },
          session: {
            label: 'Session Duration (minutes)',
            labels: ['<1', '1-5', '5-15', '15-30', '30+'],
            values: [156, 289, 345, 267, 190]
          },
          retention: {
            label: 'Retention Rate (%)',
            labels: ['Day 1', 'Day 7', 'Day 14', 'Day 30', 'Day 90'],
            values: [100, 68, 54, 43, 31]
          }
        },
        contentTypes: {
          text: 65,
          image: 20,
          file: 10,
          system: 5
        },
        userStatus: {
          online: 30,
          away: 15,
          busy: 10,
          offline: 45
        },
        userDevices: {
          desktop: 65,
          mobile: 30,
          tablet: 5
        },
        responseTimes: {
          average: 2.5,
          peak: 5.2,
          offPeak: 1.8
        }
      };

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(mockData)
      };
    }

    // Handle unexpected paths with a 404
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Not Found" })
    };

  } catch (err) {
    console.log('Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error", error: err.toString() })
    };
  }
};
