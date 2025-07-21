import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function ApiStatusIndicator({ status = 'checking' }) {
  const statusConfig = {
    online: {
      icon: CheckCircle,
      text: 'API稼働中',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    offline: {
      icon: XCircle,
      text: 'APIオフライン',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    checking: {
      icon: AlertCircle,
      text: '確認中...',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  }

  const config = statusConfig[status] || statusConfig.checking
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${config.bgColor} ${config.color}`}>
      <Icon className="w-4 h-4 mr-1.5" />
      <span className="font-medium">{config.text}</span>
    </div>
  )
}