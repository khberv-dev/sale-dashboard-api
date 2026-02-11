export function formatNumber(number: number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 60 / 60);
  const minutes = Math.floor((seconds - hours * 60 * 60) / 60);
  const dSeconds = seconds - hours * 60 * 60 - minutes * 60;

  return (hours > 0 ? `${hours} soat ` : '') + (minutes > 0 ? `${minutes} min ` : '') + `${dSeconds} sek `;
}
