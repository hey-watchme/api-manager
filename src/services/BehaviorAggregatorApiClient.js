import BaseApiClient from './BaseApiClient'

class BehaviorAggregatorApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/behavior-aggregator',
      timeout: 300000 // 5分のタイムアウト
    })
  }

  async analyzeBehavior(deviceId, date) {
    const response = await this.api.post('/analysis/sed', {
      device_id: deviceId,
      date: date
    })
    return response.data
  }

  async getTaskStatus(taskId) {
    const response = await this.api.get(`/analysis/sed/${taskId}`)
    return response.data
  }

  async getAllTasks() {
    const response = await this.api.get('/analysis/sed')
    return response.data
  }

  async deleteTask(taskId) {
    const response = await this.api.delete(`/analysis/sed/${taskId}`)
    return response.data
  }
}

export default new BehaviorAggregatorApiClient()