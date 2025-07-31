// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */ export function isObject(item) {
  return typeof item === 'object' && !Array.isArray(item)
}
/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */ export function deepMerge(target, source) {
  const output = {
    ...target,
  }
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, {
            [key]: source[key],
          })
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        Object.assign(output, {
          [key]: source[key],
        })
      }
    })
  }
  return output
}

//# sourceMappingURL=deepMerge.js.map
