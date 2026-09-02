import { supabase } from '../../supabaseClient';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa I,O,0,1

export async function generateRoomCode(): Promise<string> {
  let code: string = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += CHARS[Math.floor(Math.random() * CHARS.length)];
    }

    // Cek unik di database
    const { data } = await supabase
      .from('mabar_rooms')
      .select('id')
      .eq('code', code)
      .in('status', ['waiting', 'in_progress'])
      .maybeSingle();

    if (!data) isUnique = true;
    attempts++;
  }

  if (!code) throw new Error("Failed to generate room code");
  return code;
}
