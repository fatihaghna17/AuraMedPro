// r2Storage.ts - Helper functions for Cloudflare R2
export async function uploadQuestionsToR2(filename: string, questions: any[]): Promise<{ r2_url: string; r2_key: string } | null> {
  try {
    // 1. Dapatkan Presigned URL dari Netlify Function
    const res = await fetch('/.netlify/functions/get-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, contentType: 'application/json' }),
    });

    if (!res.ok) {
      throw new Error('Gagal mendapatkan upload URL dari server');
    }

    const { uploadUrl, fileUrl, key } = await res.json();

    // 2. Unggah file JSON langsung ke Cloudflare R2
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questions),
    });

    if (!uploadRes.ok) {
      throw new Error('Gagal mengunggah file ke Cloudflare R2');
    }

    return { r2_url: fileUrl, r2_key: key };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return null; // Fallback jika gagal
  }
}

export async function deleteQuestionsFromR2(key: string): Promise<boolean> {
  try {
    const res = await fetch('/.netlify/functions/delete-r2-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    return res.ok;
  } catch (error) {
    console.error('Error deleting from R2:', error);
    return false;
  }
}
