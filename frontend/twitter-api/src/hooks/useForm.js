import { useState } from 'react'

export const useForm = (initialValues) => {
  const [formData, setFormData] = useState(initialValues)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const resetForm = () => {
    setFormData(initialValues)
  }

  return {
    formData,
    handleChange,
    resetForm,
    setFormData
  }
}
