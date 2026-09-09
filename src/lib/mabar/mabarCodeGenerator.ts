// src/lib/mabar/mabarCodeGenerator.ts
// Generator kode room acak 6 karakter unik

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa I,O,0,1

export async function generateRoomCode(): Promise<string> {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
