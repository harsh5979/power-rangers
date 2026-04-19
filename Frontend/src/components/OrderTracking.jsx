import { CheckCircle, Package, Truck, MapPin } from 'lucide-react'

const OrderTracking = ({ order }) => {
  const getTrackingSteps = () => {
    const steps = [
      { id: 1, name: 'Order Placed', status: 'pending', icon: Package },
      { id: 2, name: 'In Transit', status: 'in transit', icon: Truck },
      { id: 3, name: 'Out for Delivery', status: 'out for delivery', icon: MapPin },
      { id: 4, name: 'Delivered', status: 'delivered', icon: CheckCircle }
    ]

    const statusOrder = ['pending', 'in transit', 'out for delivery', 'delivered']
    const currentStepIndex = statusOrder.indexOf(order.status)
    
    return steps.map((step, index) => ({
      ...step,
      completed: index < currentStepIndex || (index === currentStepIndex && order.status !== 'cancelled'),
      current: index === currentStepIndex && order.status !== 'cancelled'
    }))
  }

  const trackingSteps = getTrackingSteps()

  return (
    <div className="bg-primary/90 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-6 flex items-center">
        <Truck size={20} className="mr-2" />
        Track Your Order
      </h3>
      
      <div className="space-y-4">
        {trackingSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step.completed 
                  ? 'bg-green-600 border-green-600 text-primary-foreground' 
                  : step.current
                  ? 'bg-blue-600 border-blue-600 text-primary-foreground'
                  : 'border-border text-muted-foreground'
              }`}>
                <Icon size={20} />
              </div>
              
              <div className="ml-4 flex-1">
                <p className={`font-medium ${
                  step.completed ? 'text-green-400' : 
                  step.current ? 'text-blue-400' : 'text-muted-foreground'
                }`}>
                  {step.name}
                </p>
                {step.current && (
                  <p className="text-sm text-foreground/70">Current status</p>
                )}
                {step.completed && step.id < 4 && (
                  <p className="text-sm text-muted-foreground">Completed</p>
                )}
              </div>
              
              {index < trackingSteps.length - 1 && (
                <div className={`w-px h-8 ml-5 ${
                  step.completed ? 'bg-green-600' : 'bg-primary/70'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {order.status === 'cancelled' && (
        <div className="mt-6 bg-red-900 border border-red-700 p-4 rounded-lg">
          <p className="text-red-200 font-semibold">Order Cancelled</p>
          <p className="text-red-300 text-sm">This order has been cancelled</p>
        </div>
      )}

      {order.paymentId?.startsWith('COD') && order.status !== 'cancelled' && (
        <div className="mt-6 bg-yellow-900 border border-yellow-700 p-4 rounded-lg">
          <p className="text-yellow-200 font-semibold">Cash on Delivery</p>
          <p className="text-yellow-300 text-sm">Pay ${order.totalAmount} to the delivery person</p>
        </div>
      )}

      {order.trackingNumber && (
        <div className="mt-6 bg-blue-900 border border-blue-700 p-4 rounded-lg">
          <p className="text-blue-200 font-semibold">Tracking Number</p>
          <p className="text-blue-300 font-mono">{order.trackingNumber}</p>
        </div>
      )}
    </div>
  )
}

export default OrderTracking
