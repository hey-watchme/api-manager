import { clsx } from 'clsx'

export default function Card({ children, className = '' }) {
  return (
    <div className={clsx('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {children}
    </div>
  )
}