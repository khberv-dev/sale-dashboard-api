export function randomUsername() {
  const epoch = new Date().getTime() + Math.floor(Math.random() * 10000);
  const id = epoch.toString().slice(-8);

  return `user${id}`;
}

export function randomPassword() {
  const pattern = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';

  for (let i = 0; i < 15; i++) {
    password += pattern[Math.floor(Math.random() * pattern.length)];
  }

  return password;
}
