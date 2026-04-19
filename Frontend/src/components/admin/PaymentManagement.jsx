import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Eye, Search, Filter, Calendar } from 'lucide-react'
import api from '../../lib/axios'

const PaymentManagement = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/payment/admin/all')
      setPayments(response.data)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.merchantTransactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.orderId?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-400/10'
      case 'failed': return 'text-red-400 bg-red-400/10'
      case 'pending': return 'text-yellow-400 bg-yellow-400/10'
      default: return 'text-muted-foreground bg-muted-foreground/10'
    }
  }

  const getMethodColor = (method) => {
    switch (method) {
      case 'phonepe': return 'text-purple-400 bg-purple-400/10'
      case 'razorpay': return 'text-blue-400 bg-blue-400/10'
      case 'cod': return 'text-orange-400 bg-orange-400/10'
      default: return 'text-muted-foreground bg-muted-foreground/10'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <CreditCard className="mr-3" />
          Payment Management
        </h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search by transaction ID, user, or order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-primary/90 border border-border rounded-lg focus:outline-none focus:border-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-primary/90 border border-border rounded-lg focus:outline-none focus:border-white"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-primary rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary/90">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                  Transaction Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                  User & Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                  Amount & Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredPayments.map((payment) => (
                <motion.tr
                  key={payment._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-primary/90/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-primary-foreground">
                        {payment.merchantTransactionId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Merchant ID
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-primary-foreground">
                        {payment.user?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Order: {payment.orderId?.orderNumber || 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-primary-foreground">
                        ₹{payment.amount}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(payment.paymentMethod)}`}>
                        {payment.paymentMethod?.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <CreditCard size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No payments found</h3>
          <p className="text-muted-foreground">No payments match your current filters.</p>
        </div>
      )}
    </div>
  )
}

export default PaymentManagement