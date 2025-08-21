export default function DeviceProcessingProgress({ 
  devices = [], 
  currentIndex = 0, 
  processing = false 
}) {
  if (!devices.length) return null

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            処理進捗: {currentIndex}/{devices.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentIndex / devices.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / devices.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {devices.map((deviceId, index) => (
          <div key={deviceId} className="flex items-center text-sm">
            <div className="w-4 h-4 mr-2">
              {index < currentIndex ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : index === currentIndex && processing ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-4 h-4 bg-gray-300 rounded-full" />
              )}
            </div>
            <span className={`${
              index < currentIndex ? 'text-green-600' : 
              index === currentIndex && processing ? 'text-blue-600 font-medium' : 
              'text-gray-500'
            }`}>
              {deviceId.substring(0, 8)}...
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}