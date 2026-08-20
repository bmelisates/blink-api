import { useEffect, useRef, useState } from 'react'
import api from '../services/api'

export default function useSearch(endpoint, transform = value => value) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const requestControllerRef = useRef(null)

  useEffect(() => () => requestControllerRef.current?.abort(), [])

  const clear = () => {
    requestControllerRef.current?.abort()
    setTerm('')
    setResults([])
  }

  const clearResults = () => setResults([])

  const search = async () => {
    const keyword = term.trim()
    if (!keyword) {
      clearResults()
      return
    }

    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller

    try {
      const response = await api.get(endpoint, {
        params: { keyword },
        signal: controller.signal
      })
      setResults(response.data.map(transform))
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        console.error(`Error searching ${endpoint}:`, error)
        clearResults()
      }
    }
  }

  return { term, setTerm, results, setResults, search, clear, clearResults }
}
