import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Eye, Check, Clock, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/axios'

const ContactManagement = () => {
  const [contacts, setContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await api.get('/contact')
      setContacts(response.data)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast.error('Failed to fetch contacts')
    }
  }

  const updateStatus = async (contactId, status) => {
    try {
      await api.patch(`/contact/${contactId}/status`, { status })
      setContacts(contacts.map(contact =>
        contact._id === contactId ? { ...contact, status } : contact
      ))
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact({ ...selectedContact, status })
      }
      toast.success('Status updated successfully')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-600'
      case 'read': return 'bg-yellow-600'
      case 'replied': return 'bg-green-600'
      default: return 'bg-primary/70'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <Mail size={16} />
      case 'read': return <Eye size={16} />
      case 'replied': return <Check size={16} />
      default: return <Clock size={16} />
    }
  }

  const handleViewContact = (contact) => {
    setSelectedContact(contact)
    setShowModal(true)
    if (contact.status === 'new') {
      updateStatus(contact._id, 'read')
    }
  }

  const newContacts = contacts.filter(c => c.status === 'new').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contact Messages</h2>
        <div className="flex items-center space-x-2 bg-blue-900 px-3 py-2 rounded-lg">
          <MessageSquare size={20} />
          <span>{newContacts} New Messages</span>
        </div>
      </div>

      <div className="grid gap-4">
        {contacts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>No contact messages yet</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact._id} className="bg-primary p-6 rounded-lg border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{contact.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium text-primary-foreground ${getStatusColor(contact.status)}`}>
                      {getStatusIcon(contact.status)}
                      <span className="ml-1 capitalize">{contact.status}</span>
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">{contact.email}</p>
                  <p className="text-primary-foreground font-medium mb-2">{contact.subject}</p>
                  <p className="text-foreground/70 text-sm line-clamp-2">{contact.message}</p>
                  <p className="text-muted-foreground text-xs mt-2">
                    {new Date(contact.createdAt).toLocaleDateString()} at {new Date(contact.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleViewContact(contact)}
                    className="bg-blue-600 text-primary-foreground px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye size={16} className="inline mr-1" />
                    View
                  </button>
                  {contact.status !== 'replied' && (
                    <button
                      onClick={() => updateStatus(contact._id, 'replied')}
                      className="bg-green-600 text-primary-foreground px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check size={16} className="inline mr-1" />
                      Mark Replied
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Detail Modal */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 bg-primary bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedContact.subject}</h2>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium text-primary-foreground ${getStatusColor(selectedContact.status)}`}>
                      {getStatusIcon(selectedContact.status)}
                      <span className="ml-1 capitalize">{selectedContact.status}</span>
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {new Date(selectedContact.createdAt).toLocaleDateString()} at {new Date(selectedContact.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted-foreground hover:text-primary-foreground"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-primary/90 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedContact.name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedContact.email}</p>
                  </div>
                </div>

                <div className="bg-primary/90 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Message</h3>
                  <p className="text-foreground/70 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>

                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    {selectedContact.status !== 'replied' && (
                      <button
                        onClick={() => updateStatus(selectedContact._id, 'replied')}
                        className="bg-green-600 text-primary-foreground px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check size={16} className="inline mr-1" />
                        Mark as Replied
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-primary/70 text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ContactManagement