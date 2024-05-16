export {
  sliced
}

/**
 * Show only N first and last digits of long key string.  
 */
function sliced(s: string, n = 6) {
  return s.slice(0,n)+'...'+s.slice(-n);
}
