import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://xmumlfgzvrliepxcjqil.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdW1sZmd6dnJsaWVweGNqcWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc4ODY0MjgsImV4cCI6MjA0MzQ2MjQyOH0.QM-Y4MTmb-0BR-gxxTenQGyE0mnuJi1Why6OflYe6Ww';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function uploadTest() {
  const filePath = 'logo.jpeg';
  const file = fs.readFileSync(filePath);
  const fileName = 'test-upload.jpeg';

  try {
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('Upload failed:', error);
    } else {
      console.log('Upload successful:', data);
    }
  } catch (err) {
    console.error('Error during upload:', err);
  }
}

uploadTest();
