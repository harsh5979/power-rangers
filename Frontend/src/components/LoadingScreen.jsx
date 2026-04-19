import { motion } from 'framer-motion'

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-blue-900 to-black flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-foreground">DW</span>
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-4xl font-bold text-primary-foreground mb-4"
        >
          Dashing Winter
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-xl text-blue-300 mb-8 font-serif italic"
        >
          "Winter is Coming"
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="flex justify-center"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoadingScreen
