let refreshFn = () => {};

export function setRefresh(fn) {
  refreshFn = fn;
}

export function refresh() {
  refreshFn();
}
