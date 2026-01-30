import bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function hashMD5Object(target: object) {
  const data = Object.keys(target)
    .map((key) => target[key])
    .join('+');

  return crypto.hash('md5', data);
}
