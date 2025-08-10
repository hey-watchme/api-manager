import { DEFAULT_DEVICE_ID } from '../../config/constants'

/**
 * デバイスID入力コンポーネント
 * UUID形式のバリデーション機能付き
 */
export default function DeviceIdInput({ 
  value, 
  onChange, 
  disabled = false, 
  required = true,
  label = 'デバイスID',
  helpText = null,
  className = ''
}) {
  // UUID v4形式のバリデーション
  // 標準的なUUID形式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // yは8,9,a,bのいずれか
  const isValidUUID = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  const handleChange = (e) => {
    const newValue = e.target.value
    onChange(newValue)
  }

  const isValid = !value || isValidUUID(value)

  return (
    <div className={className}>
      <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type="text"
        id="deviceId"
        value={value}
        onChange={handleChange}
        placeholder={DEFAULT_DEVICE_ID}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${
          isValid 
            ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500' 
            : 'border-red-300 focus:ring-red-500 focus:border-red-500'
        }`}
        disabled={disabled}
        required={required}
      />
      {!isValid && value && (
        <p className="mt-1 text-sm text-red-600">
          有効なUUID形式で入力してください
        </p>
      )}
      {helpText && (
        <p className="mt-1 text-xs text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  )
}