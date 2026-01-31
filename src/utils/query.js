export const parseQueryParams = (url) => {
  const queryString = url.split("?")[1] ?? "";
  const params = new URLSearchParams(queryString);

  // destructuring + optional chaining style usage
  return {
    clientReference: params.get("clientReference") ?? "",
    documentType: params.get("documentType") ?? "",
    status: params.get("status") ?? "",
    q: params.get("q") ?? ""
  };
};
