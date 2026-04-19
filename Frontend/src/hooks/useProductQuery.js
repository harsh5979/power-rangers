// src/hooks/useProductQuery.js
import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'

const fetchProduct = async (id) => {
  const res = await api.get(`/products/${id}`)
  return {
    id: res.data._id,
    name: res.data.name,
    price: res.data.price,
    category: res.data.category,
    images: res.data.images || ['https://via.placeholder.com/400x400'],
    rating: res.data.averageRating || 4.5,
    description: res.data.description,
    totalStock: res.data.totalStock,
    sizes: res.data.sizes || [],
    isActive: res.data.isActive
  }
}

export const useProductQuery = (id) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
    staleTime: 1000 * 60,
    refetchInterval: 15000, // refresh every 15s for live stock updates
  })
}
