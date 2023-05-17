const fetcher = (resource: RequestInfo | URL) => fetch(resource).then((res) => res.json());

export default fetcher;
