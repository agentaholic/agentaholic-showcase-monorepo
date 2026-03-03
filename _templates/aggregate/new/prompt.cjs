module.exports = [
  {
    type: 'input',
    name: 'serviceName',
    message: 'Service name (camelCase):',
    validate: (input) => {
      if (!input) return 'Service name is required'
      if (!/^[a-z][a-zA-Z0-9]*$/.test(input)) {
        return 'Service name must be camelCase (start with lowercase letter, no spaces or special characters)'
      }
      return true
    },
  },
  {
    type: 'input',
    name: 'aggregateName',
    message: 'Aggregate name (PascalCase):',
    validate: (input) => {
      if (!input) return 'Aggregate name is required'
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
        return 'Aggregate name must be PascalCase (start with uppercase letter, no spaces or special characters)'
      }
      return true
    },
  },
  {
    type: 'input',
    name: 'eventName',
    message: 'Initial event name (PascalCase, full name e.g., "UserCreated"):',
    validate: (input) => {
      if (!input) return 'Event name is required'
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
        return 'Event name must be PascalCase (start with uppercase letter, no spaces or special characters)'
      }
      return true
    },
  },
]
