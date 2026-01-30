export function objectToQuery(query: object) {
  return Object.keys(query)
    .map((key) => `${key}=${query[key]}`)
    .join('&');
}
