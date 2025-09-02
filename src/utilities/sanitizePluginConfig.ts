import { defaultAddressFields } from '../fields/defaultAddressFields.js'
import type { LMSPluginConfig, SanitizedLMSPluginConfig } from '../types.js'
import type { Field } from 'payload'
import { AUD } from '../currencies/index.js'
import { defaultStudentFields } from '../fields/defaultStudentFields.js'

type Props = {
  pluginConfig: LMSPluginConfig
}

export const sanitizePluginConfig = ({ pluginConfig }: Props): SanitizedLMSPluginConfig => {
  const config = {
    ...pluginConfig,
  } as Partial<SanitizedLMSPluginConfig>

  if (
    typeof config.students === 'undefined' ||
    (typeof config.students === 'boolean' && config.students === true)
  ) {
    config.students = {
      studentsFields: ({ defaultFields }: { defaultFields: Field[] }) => defaultStudentFields(),
    }
  } else {
    const studentFields =
      (typeof pluginConfig.students === 'object' &&
        typeof pluginConfig.students.studentsFields === 'function' &&
        pluginConfig.students.studentsFields({ defaultFields: defaultStudentFields() })) ||
      defaultStudentFields()

    config.students = {
      slug: 'users',
      ...config.students,
      studentsFields: ({ defaultFields }: { defaultFields: Field[] }) => studentFields,
    }
  }

  if (
    typeof config.addresses === 'undefined' ||
    (typeof config.addresses === 'boolean' && config.addresses === true)
  ) {
    config.addresses = {
      addressFields: ({ defaultFields }: { defaultFields: Field[] }) => defaultAddressFields(),
    }
  } else {
    const addressFields =
      (typeof pluginConfig.addresses === 'object' &&
        typeof pluginConfig.addresses.addressFields === 'function' &&
        pluginConfig.addresses.addressFields({
          defaultFields: defaultAddressFields(),
        })) ||
      defaultAddressFields()

    config.addresses = {
      ...config.addresses,
      addressFields: ({ defaultFields }: { defaultFields: Field[] }) => addressFields,
    }
  }

  if (
    typeof config.endpoints === 'undefined' ||
    (typeof config.endpoints === 'boolean' && config.endpoints === true)
  ) {
    config.endpoints = []
  } else {
    config.endpoints = pluginConfig.endpoints
  }

  if (!config.currencies) {
    config.currencies = {
      defaultCurrency: 'AUD',
      supportedCurrencies: [AUD],
    }
  }

    if (typeof config.groups === 'undefined') {
      config.groups =  true
    }

    if (typeof config.courses === 'undefined') {
      config.courses =  true
    }

    if (typeof config.lessons === 'undefined') {
      config.lessons =  true
    }

    if (typeof config.quizzes === 'undefined') {
      config.quizzes =  true
    }

    if (typeof config.certificates === 'undefined') {
      config.certificates =  true
    }

    if (typeof config.questions === 'undefined') {
      config.questions =  true
    }

    if (typeof config.topics === 'undefined') {
      config.topics =  true
    }
    
    
  return config as SanitizedLMSPluginConfig
}
