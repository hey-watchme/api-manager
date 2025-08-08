// Scheduler API Client
class SchedulerApiClient {
  constructor() {
    // 本番環境ではNginxで設定したパスを、開発環境ではViteのプロキシ設定を利用
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? '/scheduler'  // Nginxの location /scheduler/ に合わせる
      : '/api/scheduler';  // Viteの proxy /api/scheduler に合わせる
  }

  async getStatus(apiName) {
    try {
      const response = await fetch(`${this.baseURL}/status/${apiName}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch status');
    } catch (error) {
      console.error('Scheduler API error:', error);
      throw error;
    }
  }

  async toggle(apiName, config) {
    try {
      const response = await fetch(`${this.baseURL}/toggle/${apiName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update configuration');
    } catch (error) {
      console.error('Scheduler API error:', error);
      throw error;
    }
  }
}

export default new SchedulerApiClient();