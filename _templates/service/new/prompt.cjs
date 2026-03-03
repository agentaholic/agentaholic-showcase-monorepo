module.exports = [
  {
    type: 'input',
    name: 'name',
    message: 'Service name (camelCase):',
    validate: (input) => {
      if (!input) return 'Service name is required'
      if (!/^[a-z][a-zA-Z0-9]*$/.test(input)) {
        return 'Service name must be camelCase (start with lowercase letter, no spaces or special characters)'
      }
      return true
    },
  },
]
