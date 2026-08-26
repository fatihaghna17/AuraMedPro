// r2Storage.ts - Helper functions for Cloudflare R2 via Pages Functions

export async function uploadQuestionsToR2(filename: string, questions: any[]): Promise<{ r2_url: string; r2_key: string } | null> {
  try {
    // Kirim content langsung ke Cloudflare Worker (R2 binding)
    const res = await fetch('/api/upload-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content: questions }),
    });

    if (!res.ok) {
      throw new Error('Gagal mengunggah file ke Cloudflare R2');
    }

    const { fileUrl, key } = await res.json();
    return { r2_url: fileUrl, r2_key: key };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return null;
  }
}

export async function deleteQuestionsFromR2(key: string): Promise<boolean> {
  try {
    const res = await fetch('/api/delete-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_R2_SECRET_TOKEN || ''}`
      },
      body: JSON.stringify({ key }),
    });
    return res.ok;
  } catch (error) {
    console.error('Error deleting from R2:', error);
    return false;
  }
}
